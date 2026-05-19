import { NextRequest, NextResponse } from 'next/server';
import { lookupIP, extractIP } from '@/lib/geo-lookup';
import { isDisposableEmail, calculateRiskScore, detectVpnHeuristic, detectImpossibleTravel } from '@/lib/security-checks';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/auth/context
 * 
 * Enriches authentication context with server-side geolocation,
 * device fingerprinting, and security signals.
 * 
 * Called by the client immediately after login/signup with:
 * - uid: Firebase user ID
 * - event: 'signup' | 'login'
 * - clientContext: browser-collected device/locale info
 * - deviceFingerprint: stable device hash
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid, event, clientContext, deviceFingerprint, email } = body;

        if (!uid || !event) {
            return NextResponse.json({ error: 'Missing uid or event' }, { status: 400 });
        }

        // 1. Extract IP and perform geolocation
        const ip = extractIP(request.headers);
        const geo = await lookupIP(ip);

        // 2. Enhance VPN detection with heuristics
        const vpnSignals = detectVpnHeuristic(geo.org, geo.asn);
        geo.isVpn = vpnSignals.isVpn;
        geo.isProxy = vpnSignals.isProxy;

        // 3. Build the context object
        const geoContext = {
            country: geo.country,
            countryCode: geo.countryCode,
            state: geo.state,
            stateCode: geo.stateCode,
            city: geo.city,
            timezone: clientContext?.timezone || geo.timezone,
            ip: ip,
            latitude: geo.latitude,
            longitude: geo.longitude,
        };

        const deviceContext = {
            browser: clientContext?.browser || 'Unknown',
            os: clientContext?.os || 'Unknown',
            deviceType: clientContext?.deviceType || 'Unknown',
            platform: clientContext?.platform || 'Unknown',
            userAgent: clientContext?.userAgent || '',
            language: clientContext?.language || 'en',
            screen: clientContext?.screen || null,
            fingerprint: deviceFingerprint || null,
        };

        const securityContext = {
            vpnDetected: geo.isVpn,
            proxyDetected: geo.isProxy,
            torDetected: geo.isTor,
            isp: geo.isp,
            asn: geo.asn,
            org: geo.org,
            disposableEmail: email ? isDisposableEmail(email) : false,
            riskScore: 0,
        };

        // 4. Check for anomalies against existing data
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : null;

        let isNewDevice = true;
        let isNewCountry = false;
        let impossibleTravel = false;

        if (userData && event === 'login') {
            // Check for new country
            const signupCountry = userData.signupContext?.country;
            const lastCountry = userData.lastLoginContext?.country;
            if (signupCountry && geo.country !== signupCountry && geo.country !== lastCountry) {
                isNewCountry = true;
            }

            // Check for impossible travel
            const lastLogin = userData.lastLoginContext;
            if (lastLogin?.latitude && lastLogin?.longitude && geo.latitude && geo.longitude) {
                const lastLoginTime = userData.lastLoginAt?.toDate?.()?.getTime() || 0;
                if (lastLoginTime > 0) {
                    impossibleTravel = detectImpossibleTravel(
                        lastLogin.latitude, lastLogin.longitude,
                        geo.latitude, geo.longitude,
                        Date.now() - lastLoginTime
                    );
                }
            }
        }

        // Check device history
        if (deviceFingerprint && userDoc.exists) {
            const deviceDoc = await userRef.collection('auth').doc('deviceHistory').get();
            const knownDevices = deviceDoc.exists ? (deviceDoc.data()?.devices || []) : [];
            isNewDevice = !knownDevices.some((d: any) => d.fingerprint === deviceFingerprint);
        }

        // 5. Calculate risk score
        securityContext.riskScore = calculateRiskScore({
            isDisposableEmail: securityContext.disposableEmail,
            isVpn: geo.isVpn,
            isProxy: geo.isProxy,
            isTor: geo.isTor,
            isNewDevice,
            isNewCountry,
            impossibleTravel,
        });

        // 6. Write to Firestore
        const now = FieldValue.serverTimestamp();

        if (event === 'signup') {
            // Store signup context (immutable — only set once)
            await userRef.update({
                signupContext: {
                    ...geoContext,
                    device: deviceContext,
                    timestamp: new Date().toISOString(),
                },
                lastLoginContext: {
                    ...geoContext,
                    device: deviceContext,
                    timestamp: new Date().toISOString(),
                },
                lastLoginAt: now,
                'security.riskScore': securityContext.riskScore,
                'security.vpnDetected': securityContext.vpnDetected,
                'security.proxyDetected': securityContext.proxyDetected,
                'security.torDetected': securityContext.torDetected,
                'security.disposableEmail': securityContext.disposableEmail,
            });
        } else {
            // Update login context (mutable — updated every login)
            await userRef.update({
                lastLoginContext: {
                    ...geoContext,
                    device: deviceContext,
                    timestamp: new Date().toISOString(),
                },
                lastLoginAt: now,
                'security.riskScore': securityContext.riskScore,
                'security.vpnDetected': securityContext.vpnDetected,
                'security.proxyDetected': securityContext.proxyDetected,
                'security.torDetected': securityContext.torDetected,
                'security.lastAnomalyCheck': new Date().toISOString(),
                ...(isNewCountry && { 'security.newCountryDetected': true }),
                ...(impossibleTravel && { 'security.impossibleTravelDetected': true }),
            });
        }

        // 7. Record session in subcollection
        await userRef.collection('auth').doc('sessions').collection('history').add({
            event,
            geo: geoContext,
            device: deviceContext,
            security: {
                riskScore: securityContext.riskScore,
                vpnDetected: securityContext.vpnDetected,
                isNewDevice,
                isNewCountry,
                impossibleTravel,
            },
            createdAt: now,
        });

        // 8. Update device history
        if (deviceFingerprint) {
            const deviceHistoryRef = userRef.collection('auth').doc('deviceHistory');
            const deviceHistoryDoc = await deviceHistoryRef.get();

            const deviceEntry = {
                fingerprint: deviceFingerprint,
                browser: deviceContext.browser,
                os: deviceContext.os,
                deviceType: deviceContext.deviceType,
                lastSeen: new Date().toISOString(),
                firstSeen: new Date().toISOString(),
            };

            if (!deviceHistoryDoc.exists) {
                await deviceHistoryRef.set({ devices: [deviceEntry] });
            } else {
                const devices = deviceHistoryDoc.data()?.devices || [];
                const existing = devices.findIndex((d: any) => d.fingerprint === deviceFingerprint);
                if (existing >= 0) {
                    devices[existing].lastSeen = new Date().toISOString();
                    devices[existing].browser = deviceContext.browser;
                    devices[existing].os = deviceContext.os;
                } else {
                    devices.push(deviceEntry);
                }
                await deviceHistoryRef.update({ devices });
            }
        }

        // 9. Flag high-risk signups for admin review
        if (securityContext.riskScore >= 0.5) {
            try {
                const adminsSnap = await adminDb.collection('users').where('role', '==', 'admin').limit(5).get();
                const notifPromises = adminsSnap.docs.map((adminDoc: any) =>
                    adminDb.collection('notifications').add({
                        recipientId: adminDoc.id,
                        senderId: uid,
                        type: 'admin_action',
                        referenceId: uid,
                        read: false,
                        createdAt: now,
                        meta: {
                            action: 'security_alert',
                            message: `⚠️ High-risk ${event}: ${email || 'Unknown'} (Score: ${securityContext.riskScore}) from ${geo.city}, ${geo.country}${geo.isVpn ? ' [VPN]' : ''}${impossibleTravel ? ' [Impossible Travel]' : ''}`,
                        }
                    })
                );
                await Promise.all(notifPromises);
            } catch (e) {
                console.error('[AuthContext] Failed to send security alert:', e);
            }
        }

        return NextResponse.json({
            success: true,
            context: {
                geo: geoContext,
                device: deviceContext,
                security: {
                    riskScore: securityContext.riskScore,
                    isNewDevice,
                    isNewCountry,
                    impossibleTravel,
                },
            },
        });

    } catch (error: any) {
        console.error('[AuthContext] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

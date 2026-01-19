import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    try {
        console.log(`Debug API: Searching for user with email: ${email}`);
        const snapshot = await adminDb.collection("users").where("email", "==", email).limit(1).get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, message: 'User not found' });
        }

        const doc = snapshot.docs[0];
        return NextResponse.json({
            success: true,
            user: {
                id: doc.id,
                ...doc.data(),
                // Convert timestamp to string if present
                createdAt: (doc.data().createdAt as any)?.toDate?.() || doc.data().createdAt
            }
        });
    } catch (error) {
        console.error('Debug API search error:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}

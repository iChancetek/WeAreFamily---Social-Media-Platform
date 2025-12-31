import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { neon } from '@neondatabase/serverless';

// Add these to force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
    // Move database connection HERE (inside the function)
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        return new Response('Database configuration error', { status: 500 });
    }

    const sql = neon(DATABASE_URL);

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('CLERK_WEBHOOK_SECRET is not set');
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error: Missing svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Verify the webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: any;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as any;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error: Invalid signature', {
            status: 400
        });
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log('Webhook event type:', eventType);

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        console.log('Processing user:', id);

        // Use sql here for database operations
        // Example:
        // await sql`INSERT INTO users (clerk_id, email, first_name, last_name, image_url) 
        //           VALUES (${id}, ${email_addresses[0].email_address}, ${first_name}, ${last_name}, ${image_url})
        //           ON CONFLICT (clerk_id) DO UPDATE SET ...`;
    }

    return new Response('Webhook processed successfully', { status: 200 });
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { getDb } from "@/lib/db";

// Force dynamic rendering for webhooks
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Database connection (inside function for Edge safety)
  const sql = getDb();

  // Clerk webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // Read Svix headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Read and stringify body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Invalid signature', { status: 400 });
  }

  // Handle event
  const eventType = evt.type;
  console.log('Webhook event type:', eventType);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = evt.data;

    console.log('Processing user:', id);

    // Example DB operation (uncomment when ready)
    /*
    await sql`
      INSERT INTO users (clerk_id, email, first_name, last_name, image_url)
      VALUES (
        ${id},
        ${email_addresses?.[0]?.email_address ?? null},
        ${first_name},
        ${last_name},
        ${image_url}
      )
      ON CONFLICT (clerk_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url;
    `;
    */
  }

  return new Response('Webhook processed successfully', { status: 200 });
}

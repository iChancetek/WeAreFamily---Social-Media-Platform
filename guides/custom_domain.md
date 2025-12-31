# Hosting & Custom Domain Guide (Firebase)

You have chosen **Google Firebase App Hosting**. This is an excellent choice for Next.js 14+ applications, as it automatically handles server-side rendering using Cloud Run.

## 1. Deploying to Firebase App Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **App Hosting** in the sidebar.
4. Click **Get Started** and connect your GitHub repository.
5. Select the repository containing "We Are Family".
6. Configure the deployment settings (usually defaults are fine, ensure the root directory is correct).
7. Firebase will automatically build and deploy your Next.js app.

## 2. Configuration for Custom Domain
Once your app is deployed on Firebase:
1. Go to **App Hosting** > **Domains**.
2. Click **Add Custom Domain**.
3. Enter your domain (e.g., `family.smith.com`).
4. Firebase will provide **TXT** and **A** records.
5. Add these records to your domain registrar (GoDaddy, Namecheap, etc.).
6. Verification can take up to 24 hours (usually much faster).

## 3. Clerk Configuration (Authentication)
**Critical**: You must allow your new Firebase domain in Clerk.

1. Go to your **Clerk Dashboard**.
2. Go to **Configure** > **Domains**.
3. Add your custom domain (e.g., `family.smith.com`).
4. Update the **DNS records** provided by Clerk (CNAME).
5. Go to **Deployment** > **Production** -> **Paths**.
6. Ensure the "Frontend API URL" matches your new domain.

## 4. Environment Variables
In the Firebase Console, under your App Hosting backend settings, add these secrets:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL` (Your Neon DB URL)
- `OPENAI_API_KEY`

*Note: Firebase App Hosting handles `.env` files differently; it's best to use the Google Cloud Secret Manager integration provided in the UI.*

# Deployment Guide for MedLeads UK

This guide will help you deploy your Next.js application to **Vercel** (recommended) or **Netlify**.

## Prerequisites
- [GitHub Account](https://github.com/)
- [Vercel Account](https://vercel.com/) (Free)

## Option 1: Vercel (Recommended)
Vercel is the creators of Next.js and provides the smoothest deployment experience.

### 1. Push to GitHub
If you haven't already, push your code to a GitHub repository.
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Connect to Vercel
1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.

### 3. Configure Environment Variables
**Crucial Step**: You must add your Firebase configuration to Vercel.
In the "Configure Project" screen, expand the **"Environment Variables"** section and add the following keys from your `.env.local` file:

| Key | Value (Copy from .env.local) |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `medleads-uk.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `medleads-uk` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `medleads-uk.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `454483217898` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:454483217898:web:cc1904a008a5160bb2f693` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-RVRFRQE1TC` |

*Note: If you hardcoded the keys in `lib/firebase.ts`, you can skip this, but using Environment Variables is best practice.*

### 4. Deploy
Click **"Deploy"**. Vercel will build your app and verify it. once the confetti flies, you are live!

## Option 2: Netlify
1.  Go to [Netlify](https://www.netlify.com/).
2.  "Add new site" -> "Import an existing project" -> GitHub.
3.  Select your repo.
4.  **Build Settings**:
    -   **Build command**: `npm run build`
    -   **Publish directory**: `.next` (Netlify handles this automatically mostly)
5.  **Environment Variables**:
    -   Click "Show advanced" or go to Site Settings > Environment Variables after checks.
    -   Add the same Firebase keys as above.
6.  **Deploy Site**.

## Post-Deployment
### Firebase Authentication Settings
-   Go to your **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized Domains**.
-   Add your new Vercel/Netlify domain (e.g., `medleads-uk.vercel.app`) to the list.
-   **If you don't do this, Google Sign-In will fail on the live site!**

## Troubleshooting
-   **Build Fails?** Check the logs. Usually it's a missing dependency or type error.
-   **Auth Error?** Check the "Authorized Domains" in Firebase.

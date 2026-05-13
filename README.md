# Magic Tissue Firebase Website

A Firebase-ready React clone of `https://magic-tissue.web.app/` with:

- Bengali landing page and product order form
- Firestore order storage
- `/admin` email/password login
- Admin order status management
- Admin landing-page editor backed by Firestore
- Firebase Hosting + Firestore rules for the free Spark plan

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` for the website and `http://localhost:5173/admin` for admin login.

## Firebase setup and deploy

### 1. Create a Firebase project

1. Go to https://console.firebase.google.com/
2. Create a project.
3. Keep Google Analytics off if you do not need it.
4. Stay on the free Spark plan.

### 2. Add a Web App

1. Project settings → General → Your apps → Web app.
2. Register the app.
3. Copy the Firebase config values into `.env`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Enable Authentication

1. Firebase Console → Authentication → Get started.
2. Sign-in method → Email/Password → Enable.
3. Users → Add user.
4. Save the email/password; this is the admin login.

### 4. Enable Firestore

1. Firebase Console → Firestore Database → Create database.
2. Choose Production mode.
3. Pick the closest region.

### 5. Make your user an admin

1. Sign in once at `/admin` with the email/password you created.
2. If access is denied, the page shows your UID.
3. Firebase Console → Firestore Database → Start collection:
   - Collection ID: `admins`
   - Document ID: the UID shown on `/admin`
   - Add any field, for example `role` = `owner`
4. Reload `/admin`.

Only users with a document at `admins/{uid}` can read orders or edit landing content.

### 6. Deploy rules and hosting

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Choose your Firebase project, then run:

```bash
npm run build
firebase deploy
```

This deploys:

- `dist/` to Firebase Hosting
- `firestore.rules` to Firestore
- `firestore.indexes.json` to Firestore

## Editing landing page content

Go to `/admin`, open **Landing Editor**, edit the JSON, and save. The public website reads `siteContent/landing` from Firestore and falls back to the built-in default content if Firestore is empty.

You can edit text, prices, products, images, shipping charges, phone number, Facebook/WhatsApp links, reviews, FAQs, and CTA copy.

## Orders

Customer orders are saved in the `orders` collection with:

- customer name, phone, address
- selected product and quantity
- shipping area and charge
- subtotal and total
- order status
- created timestamp

The admin panel can update order status to `new`, `confirmed`, `shipped`, `delivered`, or `cancelled`.

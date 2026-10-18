# Firebase-ready portfolio rebuild

A lightly modernized version of the original 2021 PHP fragrance shop, using the original 20 product images and video. Public store, shopping cart, checkout, and protected order-management dashboard are implemented with plain HTML/CSS/JS and Firebase.

## Firebase setup (required before database features work)

1. Create or select a **separate Firebase project** (recommended to avoid impacting other sites).
2. Firebase Console → Project settings → Your apps → register a Web app. Copy the config values into `public/js/firebase-config.js`.
3. Build → Authentication → Sign-in method → enable **Email/Password**. Create the administrator user via Authentication → Users → Add user.
4. Build → Firestore Database → Create database. Deploy `firestore.rules` with ``firebase deploy --only firestore:rules.
5. Copy the administrator user's **UID** from Authentication → Users. In Firestore, manually create `admins/{UID}` (document ID is the exact UID), with any harmless field such as `role: "admin"`. Never let public users create admin records.
6. Install Firebase CLI with a supported Node.js version; `firebase login`, then `firebase use --add` to associate this folder with the intended project.
7. From this directory run `firebase deploy --only hosting,firestore:rules`.
8. Visit the Hosting URL. Admin sign-in is at `/admin.html`.

**Before config:** The design and product browsing work, but submitting orders and admin login require valid Firebase configuration and deployed Firestore rules.

## Notes
- The original database credentials and PHP are **not included** in this deployable rebuild.
- The public checkout writes to Firestore without requiring customer login. Public order creation can be abused/spammed. For a real store, use Firebase App Check plus a validated server-side checkout endpoint (Cloud Functions or Cloud Run), rate limiting, and an appropriate privacy policy. Firestore rules restrict public reads, but do not eliminate spam or guarantee the order total is correct. Do not use this prototype for payment processing.
- Product names and prices are based on the original PHP site (₱150 each). Product images are from the uploaded project. Verify rights to display any brand-related images and video publicly.
- No real payment integration or stock inventory is implemented.
- Test Authentication and Firestore operations before publicly sharing the site. Avoid placing real customer data into a demo portfolio.

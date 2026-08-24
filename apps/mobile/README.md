# Tripelor Mobile

Native Android and iPhone app for Tripelor, built with Expo and React Native.

## Run locally

```bash
npm install
npm start
```

Scan the QR code using Expo Go on Android or the iPhone Camera app. The app calls the live Tripelor APIs at `https://www.tripelor.com` for availability, bookings, transfers, enquiries, and reviews.

Travelers can create an optional account through Supabase Auth or continue as a guest. Native sessions are encrypted before being persisted, with the encryption key protected by Expo SecureStore. Signed-in travelers can permanently delete their account from the **Your Tripelor** screen.

## Production builds

```bash
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile production
eas build --platform ios --profile production
```

`eas init` is required once to connect this directory to an Expo project. The production Android build is an AAB for Google Play. The iOS build runs in Expo's cloud and can be created from Windows.

Store listing copy, privacy disclosures, screenshot guidance, and the release checklist are in [`store`](./store).

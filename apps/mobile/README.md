# Tripelor Mobile

Native Android and iPhone app for Tripelor, built with Expo and React Native.

## Run locally

```bash
npm install
npm start
```

Scan the QR code using Expo Go on Android or the iPhone Camera app. The app calls the live Tripelor APIs at `https://www.tripelor.com` for availability, bookings, transfers, enquiries, and reviews.

## Production builds

```bash
npx eas-cli login
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

Apple App Store submission requires an Apple Developer account. Google Play submission requires a Google Play Console account.

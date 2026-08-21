# Tripelor 1.0 Submission Checklist

## One-time setup

- Confirm the identifiers are available in both stores: `com.tripelor.app`.
- Create the Android app in Google Play Console and the iOS app record in App Store Connect.
- Install and sign in to EAS CLI from `apps/mobile`:

```powershell
npm.cmd install -g eas-cli
eas.cmd login
eas.cmd init
```

`eas init` adds the Expo project ID to `app.json`. Keep that generated value in source control.

## Build candidates

```powershell
cd "C:\path\to\tripelor\apps\mobile"
npm.cmd install
npx.cmd expo install --check
npx.cmd tsc --noEmit
eas.cmd build --platform android --profile production
eas.cmd build --platform ios --profile production
```

The Android production profile creates an AAB for Google Play. The iOS build is created in Expo's cloud, so Windows is sufficient. EAS will guide you through Android signing and Apple credentials.

## Google Play Console

- Upload the production AAB to Internal testing first.
- Add the 512 × 512 icon, 1024 × 500 feature graphic, and at least four phone screenshots.
- Paste the listing copy from `STORE_LISTING.md`.
- Complete App access, Ads, Content rating, Target audience, Data safety, and privacy policy sections.
- Test booking, contact, transfer, review, links, keyboard handling, and the Android back gesture from the internal track.
- Promote the tested release to Production after Play Console requirements are complete.

Newer personal developer accounts may be required to complete a closed test before production access. Follow the exact requirement shown in the account's Dashboard.

## App Store Connect

- Create version **1.0** and upload the iPhone screenshots.
- Paste the listing copy from `STORE_LISTING.md`.
- Complete App Privacy using `PRIVACY_DISCLOSURES.md`, age rating, export compliance, content rights, and review contact fields.
- Upload or select the EAS production build.
- In Review Notes, explain: **Tripelor is a booking-request app. No login or payment is required. Booking requests remain unconfirmed until Tripelor contacts the guest.**
- Test through TestFlight on at least one current iPhone before selecting **Add for Review**.

## Final release gate

- Production API is reachable at `https://www.tripelor.com`.
- Privacy, terms, support, and deletion-request contact pages are live.
- No demo data, private guest data, development menus, or console errors are visible.
- Version is `1.0.0`; Android `versionCode` and iOS `buildNumber` are valid and increase on later submissions.
- App icon, splash screen, feature graphic, screenshots, and listing copy are approved by Tripelor.

# Store Privacy Disclosures

These answers reflect Tripelor mobile version 1.0 with optional Tripelor accounts. Recheck them whenever analytics, advertising, payments, location access, or another SDK is added.

## Apple App Privacy

- Does the app collect data? **Yes**
- Is data used to track users across apps or websites? **No**
- Contact Info — Name: **Collected, linked to the user, App Functionality**
- Contact Info — Email Address: **Collected, linked to the user, App Functionality and Customer Support**
- Contact Info — Phone Number: **Collected, linked to the user, App Functionality and Customer Support**
- User Content — Customer Support / Other User Content: **Collected, linked to the user, App Functionality and Customer Support**
- Other Data — Travel dates, guest counts, room and meal preferences: **Collected, linked to the user, App Functionality**
- Precise or coarse device location: **Not collected**
- Payment information: **Not collected in the app**
- Device identifiers, diagnostics, usage analytics, advertising data: **Not collected by the current app code**
- User ID: **Collected, linked to the user, App Functionality**
- Account credentials: **Processed by Supabase Auth for authentication; passwords are not available to Tripelor in plaintext**

The app uses standard HTTPS only. `ITSAppUsesNonExemptEncryption` is set to `false` in `app.json` for export-compliance reporting.

## Google Play Data safety

- Does the app collect or share required user data types? **Yes**
- Data encrypted in transit: **Yes, HTTPS**
- Users can request deletion: **Yes. Signed-in users can permanently delete their account inside the app. Requests can also be made at the public privacy-policy page or by emailing bookings@tripelor.com.**
- Account creation: **Optional email-and-password account. Users may browse and send booking requests as guests.**
- Name, email and phone: **Collected, required for booking/contact functionality**
- User ID and email: **Collected for optional account management and faster booking**
- Messages and booking details: **Collected, required for app functionality and customer support**
- Data sale: **No**
- Tracking or advertising: **No**
- Location permission or device location collection: **No**
- Financial information collected in the app: **No**

Booking details may be provided to the selected accommodation, transfer, or activity provider only when necessary to fulfil the user's request. Authentication data is processed by Supabase. Review Google's current definition of “sharing” while completing the form and disclose these recipient relationships if Play Console classifies them as sharing rather than service-provider processing.

## User-facing policy

The public privacy policy is at `https://www.tripelor.com/travel-info#privacy`. It explains optional accounts, authentication processing, data use, service-provider disclosure, retention, and access/correction/deletion requests.

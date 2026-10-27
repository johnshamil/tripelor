 # Tripelor existing-site refinement

Preserve the existing cobalt/cream coastal identity, gold globe logo, display/body fonts and all existing integrations. This is an in-place Next.js refinement, not a migration.

- First screen: compact editorial introduction and a prominent destination/date/guest search; no automatic promotional overlay.
- Navigation: primary travel services, grouped planning tools and account/help links. Keep every existing destination reachable.
- Forms: 16px mobile text, 48px controls, visible focus, bounded date inputs, no horizontal page overflow.
- Cards: consistent image aspect ratios, readable metadata, reference prices with no implied live availability.
- Property: anchored rooms, facilities, policies/photos; explicit BB/HB/FB names and inclusions. Mobile room CTA must not collide with chat or keyboard.
- Booking: preserve dates/party/contact in a short-lived account-scoped session draft. Never persist prices, availability or payment state.
- Admin: collapse secondary panels, find properties quickly, protect unsaved edits, retain current validation/save/upload behaviour.
- Local tests: synthetic Supabase REST/auth fixture only; no real secrets, email or production writes. No deployment until isolation is verified.
# Tripelor Partner Enquiries — Admin workflow

Admin: /admin/partner-enquiries

## Staff workflow
1. Create a holiday enquiry manually or prefill Amy's 19 December 2026–2 January 2027 snorkelling request. **Do not include the guest's name, email, phone, or other identifying details in the requirements field.**
2. Register partner properties with verified reservations email addresses.
3. Select the enquiry and up to ten partners, then click **Forward**. If RESEND_API_KEY and a verified sending domain are configured, the server sends a unique secure quotation link to each partner. If no sending provider is configured or sending fails, use **Copy supplier link** or **Open manual email** to forward it yourself. The UI reports delivery status; preparing a request is not proof of email delivery.
4. Partners see the travel window, guest counts, meal plan and requirements **only**, never guest identity or contact information. The link expires after 14 days, permits only one submission, and may be declined.
5. On submission, the price, availability, inclusions, exclusions and terms appear in Admin. The default customer markup is 20%, editable in the page.
6. Click **Create customer quotation draft**, then open /admin/quotations to review all inclusions, exclusions, airfares, taxes and final pricing before sharing the quotation with the guest.

## Security and deployment
- Three new tables: partner_contacts, partner_enquiries and partner_enquiry_requests.
- Supabase RLS is enabled; anon/authenticated grants revoked. Only service_role can query the underlying tables, via server-only API routes.
- All admin API actions check an actual Supabase session and Tripelor admin email. Mutations require same-origin requests.
- The public partner endpoint operates on an unguessable UUID token, validates expiry and only returns non-identifying holiday requirements. Duplicate submissions are blocked atomically.
- Tokens are secrets: do not share them on public websites or social channels.
- Apply migration **20261105173000_partner_enquiry_workflow.sql** to the production Tripelor Supabase database before merging/deploying the app changes. The schema has been applied to Tripelor Staging for review.
- External emails require the existing RESEND_API_KEY and verified sender address. No guest emails are sent automatically.
- This workflow does not hold inventory or confirm a booking. Supplier prices, seasons, flights and tax treatment remain subject to independent confirmation.

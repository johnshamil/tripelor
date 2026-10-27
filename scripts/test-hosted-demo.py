"""No browser API mocks: verifies deployed demo controls and safety boundary."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('PREVIEW_URL', 'http://localhost:4300').rstrip('/')
checks, errors, external = [], [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for width in [320, 390, 768, 1440]:
        context = browser.new_context(viewport={'width': width, 'height': 844}, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: external.append(r.url) if any(x in r.url for x in ['googletagmanager', 'google-analytics', 'api.resend', '.supabase.co']) else None)
        response = page.goto(BASE, wait_until='networkidle')
        assert response.status == 200
        assert 'noindex' in response.headers.get('x-robots-tag', '')
        assert page.get_by_role('complementary', name='Sample-data preview').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        assert page.locator('script[src*="googletagmanager"]').count() == 0
        checks.append(f'{width}px demo notice, noindex, no overflow, no ads script')
        page.locator('[name=island]').select_option(label='V. Felidhoo, Maldives')
        page.locator('[name=checkIn]').fill('2026-12-10')
        page.locator('[name=checkOut]').fill('2026-12-17')
        page.locator('.coastal-search-submit').click()
        page.wait_for_url('**/stays?**')
        assert page.locator('.coastal-property-card').count() == 2
        page.locator('.coastal-property-card').first.click()
        page.wait_for_url('**/stays/uhoos-lavish-oasis?**')
        page.get_by_role('link', name='Select Deluxe Room with Full Board, USD 115 per night').click()
        page.wait_for_url('**/login?next=**')
        page.get_by_role('button', name='Enter member demo', exact=True).click()
        page.wait_for_url('**/booking?**')
        page.get_by_role('button', name='Request My Stay').wait_for()
        page.get_by_role('button', name='10 Dec 2026').wait_for()
        assert page.get_by_role('button', name='10 Dec 2026').count() == 1
        assert page.locator('.booking-flow form select').nth(2).input_value() == 'Full Board'
        page.get_by_role('button', name='Check Live Availability', exact=True).click()
        page.get_by_text('left for these dates.', exact=False).wait_for()
        checks.append(f'{width}px search/room/meal/member demo preserves dates and sample availability')
        for path in ['/api/booking', '/api/contact', '/api/auth/signup', '/api/admin/properties/photos', '/api/admin/bookings/status', '/api/quote']:
            r = context.request.post(BASE + path, data={}, headers={'Origin': BASE})
            assert r.status == 403, (path, r.status)
        checks.append(f'{width}px real bookings/email/accounts/uploads/admin mutations blocked')
        page.get_by_role('button', name='Open admin demo', exact=True).click()
        page.wait_for_url('**/admin/properties')
        page.get_by_placeholder('Name, island or draft/published').fill('Masfalhi')
        assert page.get_by_role('button', name='Edit property').count() == 1
        page.get_by_role('button', name='Edit property').click()
        editor = page.locator('.property-editor')
        editor.locator('input').first.fill('Masfalhi View Inn Demo')
        page.get_by_role('button', name='Preview Property', exact=True).click()
        assert page.get_by_text('Private property preview', exact=True).is_visible()
        page.get_by_role('button', name='Back to editing').click()
        page.get_by_role('button', name='Save & Publish', exact=True).click()
        page.get_by_text('Unsaved changes · preview does not publish them.').wait_for(state='hidden')
        assert page.get_by_text('Sample changes applied to this browser view only.', exact=False).is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        checks.append(f'{width}px mobile admin edit/private preview/browser-view-only save')
        editor.locator('input').first.fill('Masfalhi View Inn')
        page.get_by_role('button', name='Save & Publish', exact=True).click()
        page.get_by_text('Unsaved changes · preview does not publish them.').wait_for(state='hidden')
        page.get_by_role('button', name='Sign out demo', exact=True).click()
        page.wait_for_url(BASE + '/')
        r = context.request.get(BASE + '/api/admin/properties')
        assert r.status == 401
        checks.append(f'{width}px signout removes demo admin access')
        context.close()
    browser.close()
assert not errors, errors
assert not external, external
out = {'url': BASE, 'checks': checks, 'pageErrors': errors, 'productionServiceRequests': external}
Path('/home/user/tripelor-hosted-demo-test-results.json').write_text(json.dumps(out, indent=2))
print(json.dumps(out, indent=2))
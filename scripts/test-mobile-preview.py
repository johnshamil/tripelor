"""Local-only browser checks. Requires Python Playwright and installed Chrome."""
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:4300'
OUT = Path(__file__).resolve().parent.parent / 'test-results'
OUT.mkdir(exist_ok=True)
results = []
errors = []

def record(name, detail='passed'):
    results.append({'test': name, 'result': detail})

def overflow(page, label):
    metrics = page.evaluate('({viewport:innerWidth, page:document.documentElement.scrollWidth})')
    assert metrics['page'] <= metrics['viewport'] + 1, (label, metrics)
    record(label + ' no page overflow', metrics)

def navigate(page, route):
    page.goto(BASE + route, wait_until='networkidle')
    page.evaluate('document.querySelectorAll(".smooth-reveal").forEach(e => e.classList.add("is-visible"))')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--no-sandbox'])
    for width, height in [(320, 740), (360, 800), (390, 844), (768, 1024), (1440, 1000)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce')
        context.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).hostname in ['localhost', '127.0.0.1', 'images.unsplash.com'] else route.abort())
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        navigate(page, '/')
        assert page.locator('.coastal-promo-notice').count() == 0
        overflow(page, f'{width}px homepage')
        assert page.locator('.coastal-hero h1').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
        page.get_by_role('button', name='Open menu', exact=True).click()
        menu = page.get_by_role('dialog', name='Explore Tripelor')
        assert menu.is_visible()
        page.get_by_text('Planning tools & member rewards', exact=True).click()
        assert page.locator('.brand-planning-tools[open] .brand-menu-links a').count() >= 5
        page.keyboard.press('Escape')
        assert not menu.is_visible()
        record(f'{width}px grouped navigation and Escape close')
        for control in page.locator('.coastal-search-form input, .coastal-search-form select, .coastal-search-submit').all():
            assert control.bounding_box()['height'] >= 44
        record(f'{width}px search controls at least 44px tall')
        page.screenshot(path=str(OUT / f'home-{width}.png'), full_page=True)
        page.locator('[name=island]').select_option(label='V. Felidhoo, Maldives')
        page.locator('[name=checkIn]').fill('2026-12-10')
        page.locator('[name=checkOut]').fill('2026-12-17')
        page.locator('[name=guests]').select_option('2')
        page.locator('.coastal-search-submit').click()
        page.wait_for_url('**/stays?**')
        assert page.locator('[name=checkIn]').input_value() == '2026-12-10'
        assert page.locator('[name=checkOut]').input_value() == '2026-12-17'
        assert page.locator('.coastal-property-card').count() == 2
        overflow(page, f'{width}px filtered results')
        record(f'{width}px destination/date/guest search and editable results')
        page.locator('.coastal-property-card').first.click()
        page.wait_for_url('**/stays/uhoos-lavish-oasis?**')
        page.wait_for_load_state('networkidle')
        overflow(page, f'{width}px property')
        if width < 768:
            assert not page.locator('.mobile-booking-bar').is_visible()
            assert page.locator('.property-mobile-cta').is_visible()
        assert page.locator('#property-policies').count() == 1
        assert page.get_by_text('FB · Full Board', exact=True).count() >= 1
        page.screenshot(path=str(OUT / f'property-{width}.png'), full_page=True)
        page.get_by_role('link', name='Select Deluxe Room with Full Board, USD 115 per night').click()
        page.wait_for_url('**/login?next=**')
        assert 'checkIn%3D2026-12-10' in page.url
        record(f'{width}px signed-out booking redirect preserves selection query')
        context.add_cookies([{'name': 'tripelor_access', 'value': 'mock-member', 'url': BASE}])
        navigate(page, '/booking?property=Uhoo%27s+Lavish+Oasis&roomType=Deluxe+Room&mealPlan=Full+Board&checkIn=2026-12-10&checkOut=2026-12-17&adults=2')
        page.get_by_role('button', name='Request My Stay').wait_for(state='visible')
        page.wait_for_function('!document.querySelector(".booking-flow aside button").disabled')
        inputs = page.locator('.booking-flow form input')
        inputs.nth(0).fill('Synthetic Guest')
        inputs.nth(1).fill('guest@preview.invalid')
        inputs.nth(2).fill('+960 0000000')
        page.locator('.booking-flow textarea').fill('Synthetic dietary request')
        selects = page.locator('.booking-flow form select')
        selects.nth(0).select_option('Masfalhi View Inn')
        assert page.get_by_role('button', name='10 Dec 2026').count() == 1
        assert page.get_by_role('button', name='17 Dec 2026').count() == 1
        page.reload(wait_until='networkidle')
        # Explicit URL selection wins; contact and dates must survive reload.
        page.wait_for_function('!document.querySelector(".booking-flow aside button").disabled')
        assert page.locator('.booking-flow form input').nth(0).input_value() == 'Synthetic Guest'
        assert page.locator('.booking-flow form input').nth(2).input_value() == '+960 0000000'
        assert page.get_by_text('Your booking details have been restored', exact=False).is_visible()
        overflow(page, f'{width}px booking form')
        page.screenshot(path=str(OUT / f'booking-{width}.png'), full_page=True)
        record(f'{width}px property change preserves dates and contact survives reload')
        page.get_by_role('button', name='10 Dec 2026').click()
        assert page.get_by_role('dialog').is_visible()
        overflow(page, f'{width}px date calendar')
        page.keyboard.press('Escape')
        assert page.get_by_role('dialog').count() == 0
        record(f'{width}px date dialog closes with Escape')
        page.route('**/api/availability/calendar?**', lambda route: route.fulfill(status=503, content_type='application/json', body='{"error":"Synthetic outage"}'))
        page.get_by_role('button', name='10 Dec 2026').click()
        page.get_by_text('Calendar unavailable.', exact=False).wait_for()
        page.keyboard.press('Escape')
        page.unroute('**/api/availability/calendar?**')
        record(f'{width}px calendar outage explained without fabricated availability')
        page.get_by_role('button', name='Check Live Availability', exact=True).click()
        page.get_by_text('left for these dates.', exact=False).wait_for()
        record(f'{width}px real availability route against synthetic backend')
        page.route('**/api/booking', lambda route: route.fulfill(status=401, content_type='application/json', body='{"error":"Synthetic session expired"}'))
        page.get_by_role('button', name='Request My Stay').click()
        page.get_by_role('link', name='Sign in to continue · your details stay saved in this tab').wait_for()
        assert page.locator('.booking-flow form input').nth(0).input_value() == 'Synthetic Guest'
        assert page.evaluate('sessionStorage.getItem("tripelor_booking_draft_v1")') is not None
        page.unroute('**/api/booking')
        record(f'{width}px expired session retains details and offers return-to-booking sign-in')
        # Booking completion response is simulated in-browser; no mail/hold API call.
        sent = []
        def simulated_booking(route):
            sent.append(route.request.post_data_json)
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'bookingReference': 'LOCAL-MOCK-ONLY', 'finalTotal': 805}))
        page.route('**/api/booking', simulated_booking)
        page.get_by_role('button', name='Request My Stay').click()
        page.wait_for_url('**/booking/confirmation?**')
        assert len(sent) == 1
        assert sent[0]['checkInISO'] == '2026-12-10'
        assert sent[0]['mealPlan'] == 'Full Board'
        assert page.evaluate('sessionStorage.getItem("tripelor_booking_draft_v1")') is None
        overflow(page, f'{width}px confirmation')
        record(f'{width}px SIMULATED confirmation and draft cleared')
        context.add_cookies([{'name': 'tripelor_access', 'value': 'mock-admin', 'url': BASE}])
        navigate(page, '/admin/properties')
        page.get_by_placeholder('Name, island or draft/published').wait_for()
        page.get_by_placeholder('Name, island or draft/published').fill('Masfalhi')
        assert page.get_by_role('button', name='Edit property').count() == 1
        page.get_by_role('button', name='Edit property').click()
        overflow(page, f'{width}px admin editor')
        editor = page.locator('.property-editor')
        editor.locator('input').first.fill('Masfalhi View Inn Preview')
        assert page.get_by_text('Unsaved changes · preview does not publish them.').is_visible()
        page.once('dialog', lambda dialog: dialog.dismiss())
        editor.get_by_role('button', name='Cancel', exact=True).click()
        assert editor.locator('input').first.input_value() == 'Masfalhi View Inn Preview'
        record(f'{width}px cancel protects unsaved property edits')
        page.get_by_role('button', name='Preview Property', exact=True).click()
        assert page.get_by_text('Private property preview', exact=True).is_visible()
        page.get_by_role('button', name='Back to editing').click()
        assert editor.locator('input').first.input_value() == 'Masfalhi View Inn Preview'
        page.evaluate('window.scrollTo(0, 0)')
        page.screenshot(path=str(OUT / f'admin-{width}.png'), full_page=True)
        page.get_by_role('button', name='Save & Publish', exact=True).click()
        page.get_by_text(re.compile('Sample changes applied to this browser view only.|Property published. It is now available')).wait_for()
        assert page.get_by_text('Unsaved changes · preview does not publish them.').count() == 0
        record(f'{width}px admin find/edit/private-preview/save to in-memory fixture')
        # Reset edited fixture name so the next width runs the same search.
        editor.locator('input').first.fill('Masfalhi View Inn')
        page.get_by_role('button', name='Save & Publish', exact=True).click()
        page.get_by_text('Unsaved changes · preview does not publish them.').wait_for(state='hidden')
        context.close()
    browser.close()

(OUT / 'browser-results.json').write_text(json.dumps({'checks': results, 'pageErrors': errors}, indent=2))
print(json.dumps({'checks': len(results), 'pageErrors': errors}, indent=2))
assert not errors, errors
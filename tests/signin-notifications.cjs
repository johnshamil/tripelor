const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const ts = require('typescript');

// Exercise the real route handlers, auth helper and notification sender with
// mocked HTTP/cookies. These tests never create accounts or send live email.
process.env.SUPABASE_URL = 'https://auth.example.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-secret';
process.env.RESEND_API_KEY = 'test-mail-secret';
process.env.TRIPELOR_ADMIN_EMAIL = 'bookings@tripelor.com';

const customer = {
  id: 'd2bd3c26-d62c-438e-a5ba-b2308fd4c5b1',
  email: 'customer@example.test',
  last_sign_in_at: '2026-09-17T20:30:00.000Z',
  user_metadata: { full_name: 'Customer <script>alert(1)</script>' },
};
const session = () => ({
  access_token: 'test-access-secret', refresh_token: 'test-refresh-secret',
  expires_in: 3600, user: structuredClone(customer),
});
let authResult, authStatus, mailResults, cookies, calls, warnings, mailGate, mailStarted;
function reset() {
  authResult = session(); authStatus = 200; mailResults = [200];
  cookies = []; calls = []; warnings = [];
  mailGate = null; mailStarted = null;
  process.env.RESEND_API_KEY = 'test-mail-secret';
}
reset();
async function fetchMock(url, init) {
  calls.push({ url, init });
  if (url.startsWith('https://auth.example.test/auth/v1/')) {
    return Response.json(authResult, { status: authStatus });
  }
  assert.equal(url, 'https://api.resend.com/emails');
  assert.ok(cookies.some(([name]) => name === 'tripelor_access'), 'session must exist before sending');
  assert.ok(init.signal instanceof AbortSignal, 'mail attempts need a timeout');
  if (mailStarted) mailStarted();
  if (mailGate) await mailGate;
  const outcome = mailResults.length > 1 ? mailResults.shift() : mailResults[0];
  if (outcome === 'network') throw new Error('Network failed with test-access-secret');
  return Response.json({ id: 'email-test-id' }, { status: outcome });
}
function moduleFor(path, dependencies = {}) {
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'console', js)(
    name => {
      if (name === 'node:crypto') return crypto;
      if (name in dependencies) return dependencies[name];
      throw Error('Unexpected import: ' + name);
    }, module, module.exports, fetchMock, { warn: (...args) => warnings.push(args) },
  );
  return module.exports;
}
const auth = moduleFor('lib/auth-server.ts', {
  'next/headers': { cookies: () => ({ set: (...args) => cookies.push(args) }) },
});
const notification = moduleFor('lib/signin-notifications.ts', { '@/lib/auth-server': auth });
const dependencies = { '@/lib/auth-server': auth, '@/lib/signin-notifications': notification };
const login = moduleFor('app/api/auth/login/route.ts', dependencies);
const signup = moduleFor('app/api/auth/signup/route.ts', dependencies);
const social = moduleFor('app/api/auth/social-session/route.ts', dependencies);
const emails = () => calls.filter(call => call.url === 'https://api.resend.com/emails');
async function post(route, body = {}, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.origin) headers.Origin = options.origin;
  const response = await route.POST(new Request(options.url || 'https://www.tripelor.com/api/auth/login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'request@example.test', password: 'test-password-secret', fullName: 'Untrusted request name', ...body }),
  }));
  return { status: response.status, body: await response.json() };
}
function socialPost(body = {}, origin = 'https://www.tripelor.com') {
  return post(social, {
    accessToken: 'test-google-access-secret', refreshToken: 'test-google-refresh-secret',
    expiresIn: 3600, ...body,
  }, { url: 'https://www.tripelor.com/api/auth/social-session', origin });
}

(async () => {
  let result = await post(login, { to: 'attacker@example.test', user: { email: 'spoof@example.test' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(emails().length, 1);
  const mail = JSON.parse(emails()[0].init.body);
  assert.deepEqual(mail.to, ['bookings@tripelor.com']);
  assert.deepEqual(mail.bcc, ['johnshamil87@gmail.com']);
  assert.match(mail.text, /customer@example\.test/);
  assert.match(mail.text, /18 Sept 2026, 01:30:00 MVT \(UTC\+05:00\)/);
  assert.match(mail.html, /&lt;script&gt;/);
  assert.doesNotMatch(mail.html, /<script>/);
  for (const secret of ['test-access-secret', 'test-refresh-secret', 'test-service-secret', 'test-password-secret', 'test-mail-secret']) {
    assert.ok(!emails()[0].init.body.includes(secret));
  }
  assert.doesNotMatch(emails()[0].init.body, /attacker@example|spoof@example|Untrusted request name/);
  const firstKey = emails()[0].init.headers['Idempotency-Key'];
  assert.match(firstKey, /^customer-sign-in\/[0-9a-f]{64}$/);

  reset();
  authResult.user.last_sign_in_at = '2026-09-18T08:00:00.000Z';
  await post(login);
  assert.notEqual(emails()[0].init.headers['Idempotency-Key'], firstKey, 'a later sign-in needs a new alert');

  for (const failure of ['network', 503]) {
    reset(); mailResults = [failure, 200];
    assert.equal((await post(login)).status, 200);
    assert.equal(emails().length, 2);
    assert.equal(emails()[0].init.headers['Idempotency-Key'], emails()[1].init.headers['Idempotency-Key']);
    assert.equal(emails()[0].init.body, emails()[1].init.body);
    assert.equal(warnings.length, 0);
  }
  for (const failure of ['network', 503, 429, 401]) {
    reset(); mailResults = [failure];
    result = await post(login);
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(emails().length, failure === 'network' || failure === 503 ? 2 : 1);
    assert.ok(warnings.length > 0);
    assert.doesNotMatch(JSON.stringify(warnings), /test-access-secret|customer@example\.test/);
  }

  reset(); delete process.env.RESEND_API_KEY;
  assert.equal((await post(login)).status, 200);
  assert.equal(emails().length, 0);
  assert.ok(warnings.length > 0);

  reset(); authStatus = 400; authResult = { error_description: 'Incorrect email or password.' };
  assert.equal((await post(login)).status, 400);
  assert.equal(emails().length, 0);
  assert.equal(cookies.length, 0);

  reset();
  assert.equal((await post(login, { password: '' })).status, 400);
  assert.equal(calls.length, 0);

  reset(); authResult = { user: customer };
  assert.equal((await post(login)).status, 502);
  assert.equal(emails().length, 0);
  assert.equal(cookies.length, 0);

  reset(); authResult.user.email = 'BOOKINGS@TRIPELOR.COM';
  assert.equal((await post(login)).status, 200);
  assert.equal(emails().length, 0, 'administrator sessions are not customer activity');

  reset();
  result = await post(signup);
  assert.equal(result.body.signedIn, true);
  assert.equal(emails().length, 1);
  assert.match(JSON.parse(emails()[0].init.body).subject, /New customer signed in/);

  reset(); authResult = { user: customer };
  result = await post(signup);
  assert.equal(result.body.needsConfirmation, true);
  assert.equal(result.body.signedIn, false);
  assert.equal(emails().length, 0, 'pending confirmation is not a sign-in');

  reset(); authStatus = 422; authResult = { msg: 'Unable to create account.' };
  assert.equal((await post(signup)).status, 422);
  assert.equal(emails().length, 0);

  reset(); authResult = structuredClone(customer);
  result = await socialPost({ to: 'attacker@example.test', user: { id: 'spoof', email: 'spoof@example.test' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(emails().length, 1, 'a verified Google sign-in must notify the owner');
  const socialMail = JSON.parse(emails()[0].init.body);
  assert.deepEqual(socialMail.to, ['bookings@tripelor.com']);
  assert.deepEqual(socialMail.bcc, ['johnshamil87@gmail.com']);
  assert.match(socialMail.text, /customer@example\.test/);
  assert.doesNotMatch(JSON.stringify(socialMail), /attacker@example|spoof@example|test-google-access-secret|test-google-refresh-secret/);
  const verification = calls.find(call => call.url.endsWith('/auth/v1/user'));
  assert.equal(verification.init.headers.Authorization, 'Bearer test-google-access-secret');
  const socialKey = emails()[0].init.headers['Idempotency-Key'];
  await socialPost();
  assert.equal(emails()[1].init.headers['Idempotency-Key'], socialKey, 'callback retries share the verified sign-in event key');

  // Hold the mail response open to ensure the serverless handler waits for it.
  reset(); authResult = structuredClone(customer);
  let releaseMail, startTimeout;
  mailGate = new Promise(resolve => { releaseMail = resolve; });
  const started = new Promise((resolve, reject) => {
    mailStarted = resolve;
    startTimeout = setTimeout(() => reject(new Error('Social notification was never started')), 1000);
  });
  let finished = false;
  const pending = socialPost().then(response => { finished = true; return response; });
  try {
    await started;
    assert.equal(finished, false, 'social login must await the bounded notification attempt');
  } finally {
    clearTimeout(startTimeout);
    releaseMail();
  }
  assert.equal((await pending).status, 200);

  for (const failure of ['network', 503]) {
    reset(); authResult = structuredClone(customer); mailResults = [failure];
    assert.equal((await socialPost()).status, 200, 'email failure must not break Google sign-in');
    assert.equal(emails().length, 2);
    assert.ok(cookies.some(([name]) => name === 'tripelor_access'));
    assert.ok(warnings.length > 0);
  }

  reset(); authResult = structuredClone(customer); delete process.env.RESEND_API_KEY;
  assert.equal((await socialPost()).status, 200);
  assert.equal(emails().length, 0);
  assert.ok(warnings.length > 0);

  reset(); authResult = { ...customer, email: 'BOOKINGS@TRIPELOR.COM' };
  assert.equal((await socialPost()).status, 200);
  assert.equal(emails().length, 0, 'admin social sign-ins do not send customer alerts');

  for (const [body, origin, status] of [
    [{ accessToken: '' }, 'https://www.tripelor.com', 400],
    [{ accessToken: 'x'.repeat(5001) }, 'https://www.tripelor.com', 400],
    [{}, 'https://attacker.example.test', 403],
  ]) {
    reset(); authResult = structuredClone(customer);
    assert.equal((await socialPost(body, origin)).status, status);
    assert.equal(calls.length, 0);
    assert.equal(cookies.length, 0);
  }

  reset(); authStatus = 401; authResult = { error: 'Invalid token' };
  assert.equal((await socialPost()).status, 401);
  assert.equal(emails().length, 0);
  assert.equal(cookies.length, 0);

  reset(); authResult = { email: customer.email };
  assert.equal((await socialPost()).status, 401, 'a successful HTTP lookup still needs a verified user identity');
  assert.equal(emails().length, 0);
  assert.equal(cookies.length, 0);

  console.log('PASS: password, first-session and verified Google sign-ins notify the established owner addresses; invalid/admin/pending-confirmation sessions do not. Trusted identity, HTML escaping, Maldives time, awaited delivery, retry idempotency and email failure isolation verified. No live services called.');
})().catch(error => { console.error(error); process.exit(1); });

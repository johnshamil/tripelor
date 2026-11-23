const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const testModule = { exports: {} };
const source = fs.readFileSync(path.join(root, "lib/bml-live.ts"), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
new Function("require", "module", "exports", js)(require, testModule, testModule.exports);
const bml = testModule.exports;

test("live checkout stays disabled without an explicit production switch", () => {
  const original = process.env.BML_LIVE_PAYMENTS_ENABLED;
  delete process.env.BML_LIVE_PAYMENTS_ENABLED;
  try {
    assert.equal(bml.enabled(), false);
    process.env.BML_LIVE_PAYMENTS_ENABLED = "false";
    assert.equal(bml.enabled(), false);
    process.env.BML_LIVE_PAYMENTS_ENABLED = "TRUE";
    assert.equal(bml.enabled(), false);
    process.env.BML_LIVE_PAYMENTS_ENABLED = "true";
    assert.equal(bml.enabled(), true);
  } finally {
    if (original === undefined) delete process.env.BML_LIVE_PAYMENTS_ENABLED;
    else process.env.BML_LIVE_PAYMENTS_ENABLED = original;
  }
});

test("signed webhook uses bank nonce, timestamp, SHA-256 and private API secret", () => {
  const secret = "test-key-not-real";
  const nonce = "example-nonce";
  const stamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHash("sha256").update(nonce + stamp + secret).digest("hex");
  const headers = new Headers({
    "x-signature-nonce": nonce,
    "x-signature-timestamp": stamp,
    "x-signature": signature,
  });
  assert.equal(bml.verifySignedWebhook(headers, secret), true);
  assert.equal(bml.verifySignedWebhook(headers, "wrong-key"), false);
  headers.set("x-signature", "0".repeat(64));
  assert.equal(bml.verifySignedWebhook(headers, secret), false);
  headers.delete("x-signature");
  assert.equal(bml.verifySignedWebhook(headers, secret), false);
});

test("stale, future, malformed and partial webhook signatures are rejected", () => {
  const secret = "test-key-not-real";
  const nonce = "nonce-one";
  for (const stamp of [
    String(Math.floor(Date.now() / 1000) - 1000),
    String(Math.floor(Date.now() / 1000) + 1000),
    "not-a-timestamp",
  ]) {
    const sig = crypto.createHash("sha256").update(nonce + stamp + secret).digest("hex");
    assert.equal(bml.verifySignedWebhook(new Headers({
      "x-signature-nonce": nonce,
      "x-signature-timestamp": stamp,
      "x-signature": sig,
    }), secret), false);
  }
  assert.equal(bml.verifySignedWebhook(new Headers({}), secret), false);
});

test("BML verification must match exact stored transaction, localId, currency and amount", () => {
  const intent = {
    provider_transaction_id: "tx_valid_001",
    local_id: "TRP-LIVE-example",
    currency: "USD",
    approved_amount_minor: 2999,
  };
  const bank = { id: "tx_valid_001", localId: "TRP-LIVE-example", currency: "USD", amount: 2999 };
  assert.equal(bml.matchesVerifiedTransaction(intent, bank, "tx_valid_001"), true);
  assert.equal(bml.matchesVerifiedTransaction(intent, { ...bank, amount: 2998 }, "tx_valid_001"), false);
  assert.equal(bml.matchesVerifiedTransaction(intent, { ...bank, currency: "MVR" }, "tx_valid_001"), false);
  assert.equal(bml.matchesVerifiedTransaction(intent, { ...bank, localId: "TRP-LIVE-other" }, "tx_valid_001"), false);
  assert.equal(bml.matchesVerifiedTransaction(intent, { ...bank, id: "tx_other_001" }, "tx_valid_001"), false);
  assert.equal(bml.matchesVerifiedTransaction({ ...intent, provider_transaction_id: "tx_other_001" }, bank, "tx_valid_001"), false);
});

test("BML signed request does not require card credentials in browser", () => {
  const secret = "test-key-not-real";
  const expected = crypto.createHash("sha1").update("amount=125&currency=USD&apiKey=" + secret).digest("hex");
  assert.equal(bml.bankSignature(125, "USD", secret), expected);
  assert.equal(bml.paymentId.test("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(bml.paymentId.test("../admin"), false);
});


test("early confirmed webhook matches only an initiated, consented bank transaction", () => {
  const bank = { id: "txn_confirmed_001", localId: "TRP-LIVE-early", amount: 500, currency: "USD" };
  const base = {
    local_id: bank.localId,
    approved_amount_minor: 500,
    currency: "USD",
    provider_transaction_id: null,
    status: "initiated",
    customer_terms_accepted_at: new Date().toISOString(),
  };
  assert.equal(bml.matchesVerifiedTransaction(base, bank, bank.id), true);
  assert.equal(bml.matchesVerifiedTransaction({ ...base, status: "awaiting_payment" }, bank, bank.id), false);
  assert.equal(bml.matchesVerifiedTransaction({ ...base, customer_terms_accepted_at: null }, bank, bank.id), false);
  assert.equal(bml.matchesVerifiedTransaction({ ...base, approved_amount_minor: 501 }, bank, bank.id), false);
  assert.equal(bml.matchesVerifiedTransaction({ ...base, provider_transaction_id: "other_bank_id" }, bank, bank.id), false);
});

test("bank transaction request uses app ID and never sends the key in body", async () => {
  const fetchBefore = global.fetch;
  const keyBefore = process.env.BML_LIVE_API_KEY;
  const appBefore = process.env.BML_LIVE_APPLICATION_ID;
  process.env.BML_LIVE_API_KEY = "offline-fake-bml-secret";
  process.env.BML_LIVE_APPLICATION_ID = "11111111-1111-4111-8111-111111111111";
  try {
    let called = 0;
    global.fetch = async (url, options) => {
      called += 1;
      assert.equal(url, "https://api.merchants.bankofmaldives.com.mv/public/transactions");
      assert.equal(options.headers.Authorization, process.env.BML_LIVE_API_KEY);
      const payload = JSON.parse(options.body);
      assert.equal(payload.deviceId, process.env.BML_LIVE_APPLICATION_ID);
      assert.equal(payload.amount, 250);
      assert.equal(payload.currency, "USD");
      assert.equal(payload.localId, "TRP-LIVE-offline");
      assert.equal(JSON.stringify(payload).includes(process.env.BML_LIVE_API_KEY), false);
      return Response.json({
        id: "bank_txn_12345",
        url: "https://checkout.merchants.bankofmaldives.com.mv/checkout/test",
      });
    };
    const result = await bml.bankCreate({
      approved_amount_minor: 250,
      currency: "USD",
      local_id: "TRP-LIVE-offline",
      booking_reference: "TRP-TEST",
    }, "https://www.tripelor.com/pay/test");
    assert.equal(result.id, "bank_txn_12345");
    assert.equal(called, 1);
  } finally {
    global.fetch = fetchBefore;
    if (keyBefore === undefined) delete process.env.BML_LIVE_API_KEY;
    else process.env.BML_LIVE_API_KEY = keyBefore;
    if (appBefore === undefined) delete process.env.BML_LIVE_APPLICATION_ID;
    else process.env.BML_LIVE_APPLICATION_ID = appBefore;
  }
});

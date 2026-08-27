import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const appFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app-secure.js");
function webhookSignature(body, secret) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
  return "t=" + timestamp + ",v1=" + signature;
}
function postWebhook(server, event, secret) {
  const body = JSON.stringify(event);
  const address = server.address();
  return new Promise((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port: address.port, method: "POST", path: "/api/stripe/webhook", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body), "stripe-signature": webhookSignature(body, secret) } }, (response) => {
      let payload = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { payload += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, payload }));
    });
    request.on("error", reject);
    request.end(body);
  });
}
function paidEvent(purchase, sessionId) {
  return { type: "checkout.session.completed", data: { object: { id: sessionId, client_reference_id: purchase.id, payment_status: "paid" } } };
}
function getPrivateAccess(server, token) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port: address.port, method: "GET", path: "/api/access/" + encodeURIComponent(token) }, (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode));
    });
    request.on("error", reject);
    request.end();
  });
}
test("email failure preserves paid access, retry reuses its link, and duplicate webhooks do not resend", async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "quizzes-email-lifecycle-"));
  const dataFile = path.join(dataDir, "purchases.json");
  const webhookSecret = "whsec_email_lifecycle_test";
  const encryptionKey = crypto.randomBytes(32).toString("base64");
  const originalFetch = globalThis.fetch;
  const originalEnvironment = { DATA_DIR: process.env.DATA_DIR, STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET, RESEND_API_KEY: process.env.RESEND_API_KEY, MAIL_FROM: process.env.MAIL_FROM, APP_ORIGIN: process.env.APP_ORIGIN, PRIVATE_ACCESS_TOKEN_ENCRYPTION_KEY: process.env.PRIVATE_ACCESS_TOKEN_ENCRYPTION_KEY, NODE_ENV: process.env.NODE_ENV };
  let delivery = "success";
  const messages = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    messages.push(JSON.parse(options.body));
    return new Response(JSON.stringify(delivery === "success" ? { id: "email_" + messages.length } : { message: "recipient rejected" }), { status: delivery === "success" ? 200 : 422, headers: { "content-type": "application/json" } });
  };
  process.env.DATA_DIR = dataDir;
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  process.env.RESEND_API_KEY = "re_test";
  process.env.MAIL_FROM = "hello@send.quizzes.it.com";
  process.env.APP_ORIGIN = "https://quizzes.test";
  process.env.PRIVATE_ACCESS_TOKEN_ENCRYPTION_KEY = encryptionKey;
  process.env.NODE_ENV = "test";
  const now = new Date().toISOString();
  const successfulPurchase = { id: "purchase-success", email: "delivered+success@resend.dev", status: "pending", createdAt: now, accessTokenHash: null, paidAt: null, expiresAt: null, emailSentAt: null, stripeSessionId: "cs_success", quizId: "REL01", quizVersion: "3.1", offerId: "rel01-full", offerSnapshot: { label: "Full private result", currency: "hkd", amount: 2900 }, previewAnswers: [], locale: "en" };
  const failedPurchase = { ...successfulPurchase, id: "purchase-failed", email: "delivered+failed@resend.dev", stripeSessionId: "cs_failed" };
  fs.writeFileSync(dataFile, JSON.stringify({ purchases: [successfulPurchase, failedPurchase], previewSessions: [] }));
  const moduleUrl = pathToFileURL(appFile).href + "?email-lifecycle=" + Date.now();
  const { server, accessPurchase, retryAccessEmail } = await import(moduleUrl);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const success = await postWebhook(server, paidEvent(successfulPurchase, "cs_success"), webhookSecret);
    assert.equal(success.status, 200);
    let store = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const persistedSuccess = store.purchases.find((purchase) => purchase.id === successfulPurchase.id);
    assert.equal(persistedSuccess.status, "paid");
    assert.ok(persistedSuccess.accessTokenHash);
    assert.ok(persistedSuccess.accessTokenEncrypted);
    assert.equal(persistedSuccess.emailStatus, "sent");
    assert.equal(persistedSuccess.emailAttempts, 1);
    assert.ok(persistedSuccess.emailSentAt);
    const successToken = new URL(messages[0].html.match(/href="([^"]+)"/)[1]).pathname.split("/").pop();
    assert.equal(accessPurchase(successToken)?.id, successfulPurchase.id);
    assert.equal(await getPrivateAccess(server, successToken), 200);
    const duplicate = await postWebhook(server, paidEvent(successfulPurchase, "cs_success"), webhookSecret);
    assert.equal(duplicate.status, 200);
    store = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    assert.equal(store.purchases.length, 2);
    assert.equal(store.purchases.find((purchase) => purchase.id === successfulPurchase.id).emailAttempts, 1);
    assert.equal(messages.length, 1);
    delivery = "failure";
    const failure = await postWebhook(server, paidEvent(failedPurchase, "cs_failed"), webhookSecret);
    assert.equal(failure.status, 200);
    store = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const persistedFailure = store.purchases.find((purchase) => purchase.id === failedPurchase.id);
    assert.equal(persistedFailure.status, "paid");
    assert.ok(persistedFailure.accessTokenHash);
    assert.ok(persistedFailure.accessTokenEncrypted);
    assert.equal(persistedFailure.emailStatus, "failed");
    assert.equal(persistedFailure.emailAttempts, 1);
    assert.equal(persistedFailure.emailSentAt, null);
    const failureToken = new URL(messages[1].html.match(/href="([^"]+)"/)[1]).pathname.split("/").pop();
    assert.equal(accessPurchase(failureToken)?.id, failedPurchase.id);
    assert.equal(await getPrivateAccess(server, failureToken), 200);
    delivery = "success";
    await retryAccessEmail(failedPurchase.id);
    store = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const retriedFailure = store.purchases.find((purchase) => purchase.id === failedPurchase.id);
    assert.equal(retriedFailure.emailStatus, "sent");
    assert.equal(retriedFailure.emailAttempts, 2);
    assert.equal(retriedFailure.accessTokenHash, persistedFailure.accessTokenHash);
    const retryToken = new URL(messages[2].html.match(/href="([^"]+)"/)[1]).pathname.split("/").pop();
    assert.equal(retryToken, failureToken);
    assert.equal(accessPurchase(retryToken)?.id, failedPurchase.id);
    assert.equal(await getPrivateAccess(server, retryToken), 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

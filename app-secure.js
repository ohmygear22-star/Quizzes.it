import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { defaultQuiz, getPublicQuizBySlug, getQuizByIdAndVersion, getQuizBySlug, listPublicQuizzes, evaluatePreview, evaluateQuiz, isAdaptiveQuiz, isAssessmentComplete, previewQuestions, nextAdaptiveQuestion } from "./v31/production-adapter.js";

const port = Number(process.env.PORT || 3000);
const dataDir = process.env.DATA_DIR || "/data";
const dataFile = path.join(dataDir, "purchases.json");
const appOrigin = process.env.APP_ORIGIN || "https://quizzes.it.com";
const accessDays = 7;
const previewAuthHeader = process.env.PREVIEW_AUTH_HEADER || "";
function allowsPreviewRequest(request, url) {
  if (!previewAuthHeader || url.pathname === "/health" || url.pathname === "/api/stripe/webhook") return true;
  const received = Buffer.from(request.headers.authorization || "");
  const expected = Buffer.from(previewAuthHeader);
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
const checkoutLimit = new Map();

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      previewSessions: Array.isArray(parsed.previewSessions) ? parsed.previewSessions : []
    };
  } catch (error) {
    if (error.code === "ENOENT") return { purchases: [], previewSessions: [] };
    throw error;
  }
}

function writeStore(store) {
  fs.mkdirSync(dataDir, { recursive: true });
  const temporary = dataFile + ".tmp";
  fs.writeFileSync(temporary, JSON.stringify(store));
  fs.renameSync(temporary, dataFile);
}

function cleanExpired() {
  const store = readStore();
  const now = Date.now();
  const purchases = store.purchases.filter((purchase) => {
    if (purchase.status === "pending") return now - Date.parse(purchase.createdAt) < 24 * 60 * 60 * 1000;
    return !purchase.expiresAt || Date.parse(purchase.expiresAt) > now;
  });
  const previewSessions = store.previewSessions.filter((session) => Date.parse(session.expiresAt) > now);
  if (purchases.length !== store.purchases.length || previewSessions.length !== store.previewSessions.length) {
    writeStore({ purchases, previewSessions });
  }
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 20_000) {
        reject(new Error("Payload too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function allow(key, limit, windowMs) {
  const now = Date.now();
  const attempts = (checkoutLimit.get(key) || []).filter((time) => time > now - windowMs);
  if (attempts.length >= limit) return false;
  attempts.push(now);
  checkoutLimit.set(key, attempts);
  return true;
}

function accessPurchase(token) {
  const store = readStore();
  const purchase = store.purchases.find((item) => item.accessTokenHash === hash(token));
  if (!purchase || purchase.status !== "paid" || Date.parse(purchase.expiresAt) <= Date.now()) return null;
  return purchase;
}

function cookies(request) {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").map((part) => {
    const index = part.indexOf("=");
    return index < 0 ? [] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }).filter((entry) => entry.length));
}

function quizForPurchase(purchase) {
  const quizId = purchase.quizId || defaultQuiz.id;
  const quizVersion = purchase.quizVersion || defaultQuiz.version;
  return getQuizByIdAndVersion(quizId, quizVersion);
}

function previewSessionFor(request, quiz) {
  const token = cookies(request).quiz_preview;
  if (!token) return null;
  const store = readStore();
  return store.previewSessions.find((session) =>
    session.tokenHash === hash(token) &&
    session.quizId === quiz.id &&
    session.quizVersion === quiz.version &&
    Date.parse(session.expiresAt) > Date.now()
  ) || null;
}

function productAccessPayload(purchase) {
  const product = quizForPurchase(purchase);
  if (!product) return null;
  const previewAnswers = Array.isArray(purchase.previewAnswers) ? purchase.previewAnswers : [];
  const adaptive = isAdaptiveQuiz(product);
  const completedAnswers = Array.isArray(purchase.completedAnswers) ? purchase.completedAnswers : null;
  const completed = purchase.v31Result ? { result: purchase.v31Result } : (completedAnswers ? evaluateQuiz(product, completedAnswers).completed : null);
  return {
    quiz: { id: product.id, slug: product.slug, version: product.version, title: product.metadata.title, questionRange: product.metadata.questionRange || null },
    questions: [],
    previewAnswerCount: previewAnswers.length,
    previewAnswers: adaptive ? previewAnswers : undefined,
    resumeAnswers: adaptive ? (purchase.v31Session?.answers || previewAnswers) : undefined,
    adaptive,
    expiresAt: purchase.expiresAt,
    completed
  };
}
async function sendProductAccessEmail(purchase, token) {
  const product = quizForPurchase(purchase);
  if (!product) throw new Error("Purchased quiz version is unavailable");
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const link = appOrigin + "/access/" + encodeURIComponent(token);
  const title = String(product.metadata.title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const continuation = Array.isArray(purchase.previewAnswers) && purchase.previewAnswers.length
    ? "Your first preview answers are saved, so you will continue from the remaining questions."
    : "Take your time. You can return to your quiz while your access is active.";
  const html = '<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f5f4f2;color:#29282c;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f4f2;"><tr><td align="center" style="padding:40px 16px;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;"><tr><td style="padding:52px 52px 46px;">' +
    '<p style="margin:0 0 34px;text-align:center;"><img src="' + appOrigin + '/brand-arch.png" width="68" height="68" alt="Quizzes it" style="display:inline-block;border:0;outline:0;text-decoration:none;"></p>' +
    '<p style="margin:0 0 52px;text-align:center;color:#29282c;font-size:13px;font-weight:700;letter-spacing:5px;">QUIZZES IT</p>' +
    '<h1 style="margin:0 0 28px;color:#29282c;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:-0.6px;">Your private quiz is ready.</h1>' +
    '<p style="margin:0 0 20px;color:#3b3a3e;font-size:18px;line-height:1.55;">Thank you for your purchase. Your personal access link is ready for <strong>' + title + '</strong>.</p>' +
    '<p style="margin:0 0 34px;color:#3b3a3e;font-size:18px;line-height:1.55;">' + continuation + '</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:12px;background:#171717;"><a href="' + link + '" style="display:inline-block;padding:18px 26px;color:#ffffff;font-size:17px;font-weight:700;line-height:1;text-decoration:none;">Continue your private quiz &#8594;</a></td></tr></table>' +
    '<div style="height:1px;margin:42px 0 25px;background:#e3e0dc;"></div>' +
    '<p style="margin:0 0 28px;color:#625f5d;font-size:15px;line-height:1.55;"><strong style="color:#29282c;">Private access:</strong> This link is personal to you and expires in 7 days. No account is needed.</p>' +
    '<p style="margin:0 0 44px;color:#625f5d;font-size:15px;line-height:1.55;">Need help with your link? Reply to this email and we will help.</p>' +
    '<p style="margin:0;color:#3b3a3e;font-size:16px;line-height:1.5;">Warmly,<br><strong>Quizzes it</strong></p>' +
    '</td></tr></table></td></tr></table></body></html>';
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: from.includes("<") ? from : "Quizzes it <" + from + ">",
      to: [purchase.email],
      subject: "Your Quizzes it access link",
      html,
      text: "Your private quiz is ready.\n\nPayment received for " + product.metadata.title + ".\n\n" + continuation + "\n\nContinue your private quiz: " + link + "\n\nThis personal link expires in 7 days. No account is needed.\n\nNeed help? Reply to this email."
    })
  });
  if (!response.ok) throw new Error("Email delivery failed");
}
function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

function verifyStripeSignature(body, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || typeof signature !== "string") return false;
  const pairs = signature.split(",").map((part) => {
    const i = part.indexOf("=");
    return i < 0 ? [] : [part.slice(0, i), part.slice(i + 1)];
  });
  const timestamp = pairs.find(([key]) => key === "t")?.[1];
  const values = pairs.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  if (!timestamp || !values.length || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(timestamp + "." + body.toString("utf8")).digest("hex"), "utf8");
  return values.some((value) => {
    const received = Buffer.from(value, "utf8");
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  });
}

async function createCheckout(email) {
  const purchase = {
    id: crypto.randomUUID(),
    email,
    status: "pending",
    createdAt: new Date().toISOString(),
    accessTokenHash: null,
    paidAt: null,
    expiresAt: null,
    emailSentAt: null,
    stripeSessionId: null
  };
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", appOrigin + "/payment-success?session_id={CHECKOUT_SESSION_ID}");
  params.set("cancel_url", appOrigin + "/payment-cancelled");
  params.set("customer_email", email);
  params.set("client_reference_id", purchase.id);
  params.set("line_items[0][price_data][currency]", quiz.currency);
  params.set("line_items[0][price_data][product_data][name]", quiz.title);
  params.set("line_items[0][price_data][unit_amount]", String(quiz.amount));
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[quiz_id]", quiz.id);
  params.set("integration_identifier", "quizzes_" + crypto.randomBytes(4).toString("hex"));
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-06-24.dahlia"
    },
    body: params
  });
  if (!response.ok) throw new Error("Checkout could not be created");
  const session = await response.json();
  purchase.stripeSessionId = session.id;
  const store = readStore();
  store.purchases.push(purchase);
  writeStore(store);
  return session.url;
}

function offerFor(quiz, offerId) {
  return quiz.offers.find((offer) => offer.id === offerId) || null;
}

async function createProductCheckout(email, quizProduct, offer, previewSession) {
  const purchase = {
    id: crypto.randomUUID(), email, status: "pending", createdAt: new Date().toISOString(),
    accessTokenHash: null, paidAt: null, expiresAt: null, emailSentAt: null, stripeSessionId: null,
    quizId: quizProduct.id, quizVersion: quizProduct.version, offerId: offer.id,
    offerSnapshot: { label: offer.label, currency: offer.currency, amount: offer.amount },
    previewAnswers: previewSession.answers
  };
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", appOrigin + "/payment-success?session_id={CHECKOUT_SESSION_ID}");
  params.set("cancel_url", appOrigin + "/payment-cancelled");
  params.set("customer_email", email);
  params.set("client_reference_id", purchase.id);
  params.set("line_items[0][price_data][currency]", offer.currency);
  params.set("line_items[0][price_data][product_data][name]", quizProduct.metadata.title + " — " + offer.label);
  params.set("line_items[0][price_data][unit_amount]", String(offer.amount));
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[quiz_id]", quizProduct.id);
  params.set("metadata[quiz_version]", String(quizProduct.version));
  params.set("metadata[offer_id]", offer.id);
  params.set("integration_identifier", "quizzes_" + crypto.randomBytes(4).toString("hex"));
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2026-06-24.dahlia" },
    body: params
  });
  if (!response.ok) throw new Error("Checkout could not be created");
  const session = await response.json();
  purchase.stripeSessionId = session.id;
  const store = readStore();
  store.purchases.push(purchase);
  writeStore(store);
  return session.url;
}

async function markPaid(session) {
  const purchaseId = session.client_reference_id;
  if (!purchaseId) throw new Error("Missing purchase reference");
  const store = readStore();
  const purchase = store.purchases.find((item) => item.id === purchaseId);
  if (!purchase) throw new Error("Unknown purchase");
  if (purchase.stripeSessionId && session.id && purchase.stripeSessionId !== session.id) throw new Error("Checkout session does not match purchase");
  if (purchase.status === "paid" && purchase.emailSentAt) return;
  const token = crypto.randomBytes(32).toString("base64url");
  purchase.accessTokenHash = hash(token);
  purchase.status = "paid";
  purchase.paidAt = new Date().toISOString();
  purchase.expiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000).toISOString();
  purchase.stripeSessionId = session.id || purchase.stripeSessionId;
  writeStore(store);
  await sendProductAccessEmail(purchase, token);
  purchase.emailSentAt = new Date().toISOString();
  writeStore(store);
}

const server = http.createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Frame-Options", "DENY");
  try {
    cleanExpired();
    const url = new URL(request.url, "http://droplet-local");
    if (!allowsPreviewRequest(request, url)) {
      response.writeHead(401, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "WWW-Authenticate": "Basic realm=\"Quiz preview\"" });
      return response.end("Preview access required");
    }

  if (request.method === "GET" && url.pathname === "/multi-quiz.js") {
    const script = fs.readFileSync("/app/public/multi-quiz.js");
    response.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" });
    return response.end(script);
  }

  if (request.method === "GET" && url.pathname === "/brand-arch.png") {
    const image = fs.readFileSync("/app/public/brand-arch.png");
    response.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" });
    return response.end(image);
  }

  if (request.method === "GET" && !url.pathname.startsWith("/api/") && url.pathname !== "/health") {
      const page = fs.readFileSync("/app/public/index.html");
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return response.end(page);
    }
    if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { status: "ok" });
  if (request.method === "GET" && url.pathname === "/api/quizzes") {
    return sendJson(response, 200, { quizzes: listPublicQuizzes() });
  }

  const quizMatch = url.pathname.match(/^\/api\/quizzes\/([a-z0-9-]+)$/);
  if (request.method === "GET" && quizMatch) {
    const product = getPublicQuizBySlug(quizMatch[1]);
    return product
      ? sendJson(response, 200, product)
      : sendJson(response, 404, { error: "Quiz not found" });
  }
        const previewMatch = url.pathname.match(/^\/api\/quizzes\/([a-z0-9-]+)\/preview$/);
    if (request.method === "GET" && previewMatch) {
      const product = getQuizBySlug(previewMatch[1]);
      if (!product || product.status !== "live" || (!isAdaptiveQuiz(product) && !product.preview?.enabled)) return sendJson(response, 404, { error: "Preview not found" });
      return sendJson(response, 200, { title: product.metadata.title, adaptive: isAdaptiveQuiz(product), questionRange: product.metadata.questionRange || null, questions: previewQuestions(product).map((question) => ({ id: question.id, text: question.text, options: question.options.map((option) => ({ id: option.id, text: option.text })) })) });
    }
    if (request.method === "POST" && previewMatch) {
      const product = getQuizBySlug(previewMatch[1]);
      if (!product || product.status !== "live" || (!isAdaptiveQuiz(product) && !product.preview?.enabled)) return sendJson(response, 404, { error: "Preview not found" });
      const body = JSON.parse((await readBody(request)).toString("utf8"));
      const teaser = evaluatePreview(product, body.answers);
      const token = crypto.randomBytes(32).toString("base64url");
      const store = readStore();
      store.previewSessions.push({ tokenHash: hash(token), quizId: product.id, quizVersion: product.version, answers: body.answers, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
      writeStore(store);
      return sendJson(response, 200, { teaser }, { "Set-Cookie": "quiz_preview=" + encodeURIComponent(token) + "; Max-Age=86400; Path=/; HttpOnly; Secure; SameSite=Lax" });
    }

    if (request.method === "POST" && url.pathname === "/api/checkout") {
      if (!stripeConfigured()) return sendJson(response, 503, { error: "Checkout is not configured" });
      const remote = request.socket.remoteAddress || "unknown";
      if (!allow(remote, 5, 10 * 60 * 1000)) return sendJson(response, 429, { error: "Please try again later" });
      const body = JSON.parse((await readBody(request)).toString("utf8"));
      if (!validEmail(body.email)) return sendJson(response, 400, { error: "Enter a valid email address" });
      const product = getQuizBySlug(body.quizSlug);
      const offer = product && offerFor(product, body.offerId);
      const preview = product && previewSessionFor(request, product);
      if (!product || product.status !== "live" || !offer || !preview) return sendJson(response, 400, { error: "Complete the free preview before checkout" });
      return sendJson(response, 200, { checkoutUrl: await createProductCheckout(body.email.trim().toLowerCase(), product, offer, preview) });
    }
    if (request.method === "POST" && url.pathname === "/api/stripe/webhook") {
      const raw = await readBody(request);
      if (!verifyStripeSignature(raw, request.headers["stripe-signature"])) return sendJson(response, 400, { error: "Invalid webhook" });
      const event = JSON.parse(raw.toString("utf8"));
      if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) && event.data.object.payment_status === "paid") await markPaid(event.data.object);
      return sendJson(response, 200, { received: true });
    }
    const accessMatch = url.pathname.match(/^\/api\/access\/([^/]+)$/);
    if (request.method === "GET" && accessMatch) {
      const purchase = accessPurchase(accessMatch[1]);
      if (!purchase) return sendJson(response, 404, { error: "This link is unavailable or has expired" });
      const payload = productAccessPayload(purchase);
      if (!payload) return sendJson(response, 410, { error: "This quiz version is unavailable" });
      return sendJson(response, 200, payload);
    }
    const nextMatch = url.pathname.match(/^\/api\/access\/([^/]+)\/next$/);
  if (request.method === "POST" && nextMatch) {
    const purchase = accessPurchase(nextMatch[1]);
    if (!purchase) return sendJson(response, 404, { error: "This link is unavailable or has expired" });
    const product = quizForPurchase(purchase);
    if (!product || !isAdaptiveQuiz(product)) return sendJson(response, 404, { error: "An adaptive quiz is not available" });
    const body = JSON.parse((await readBody(request)).toString("utf8"));
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const savedPreview = Array.isArray(purchase.previewAnswers) ? purchase.previewAnswers : [];
    if (!body.retake && JSON.stringify(answers.slice(0, savedPreview.length)) !== JSON.stringify(savedPreview)) return sendJson(response, 400, { error: "Preview answers do not match this access link" });
    const next = nextAdaptiveQuestion(product, answers);
    purchase.v31Session = { ...next.state, updatedAt: new Date().toISOString() };
    const sessionStore = readStore();
    const sessionIndex = sessionStore.purchases.findIndex((item) => item.id === purchase.id);
    if (sessionIndex >= 0) sessionStore.purchases[sessionIndex] = purchase;
    writeStore(sessionStore);
    return sendJson(response, 200, { complete: !next.question, reason: next.reason, question: next.question ? { id: next.question.id, text: next.question.text, options: next.question.options.map((option) => ({ id: option.id, text: option.text })) } : null });
  }
  const resultMatch = url.pathname.match(/^\/api\/access\/([^/]+)\/result$/);
    if (request.method === "POST" && resultMatch) {
      const purchase = accessPurchase(resultMatch[1]);
      if (!purchase) return sendJson(response, 404, { error: "This link is unavailable or has expired" });
      const product = quizForPurchase(purchase);
      if (!product) return sendJson(response, 410, { error: "This quiz version is unavailable" });
      const body = JSON.parse((await readBody(request)).toString("utf8"));
      const previewAnswers = Array.isArray(purchase.previewAnswers) ? purchase.previewAnswers : [];
      const isRetake = body.retake === true;
      let answers = body.answers;
      if (!isRetake && isAdaptiveQuiz(product) && JSON.stringify((Array.isArray(answers) ? answers : []).slice(0, previewAnswers.length)) !== JSON.stringify(previewAnswers)) return sendJson(response, 400, { error: "Preview answers do not match this access link" });
      if (isAdaptiveQuiz(product) && !isAssessmentComplete(product, answers)) return sendJson(response, 409, { error: "Continue answering the adaptive questions before viewing your result" });
      if (!isRetake && !isAdaptiveQuiz(product) && previewAnswers.length && Array.isArray(body.answers) && body.answers.length === product.questions.length - previewAnswers.length) answers = [...previewAnswers, ...body.answers];
      const outcome = evaluateQuiz(product, answers);
      purchase.completedAnswers = answers;
      purchase.v31Session = outcome.state;
    purchase.v31Result = outcome.completed.result;
    purchase.resultEmailStatus = "disabled";
    purchase.completedAt = new Date().toISOString();
      purchase.retakeCount = isRetake ? Number(purchase.retakeCount || 0) + 1 : Number(purchase.retakeCount || 0);
      const store = readStore();
      const index = store.purchases.findIndex((item) => item.id === purchase.id);
      if (index >= 0) store.purchases[index] = purchase;
      writeStore(store);
      return sendJson(response, 200, outcome);
    }
    return sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    console.error("Quiz request failed", { method: request.method, path: request.url, error: error instanceof Error ? error.stack : String(error) });
    return sendJson(response, 500, { error: "The service could not complete that request" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log("Quiz service ready on port " + port);
});

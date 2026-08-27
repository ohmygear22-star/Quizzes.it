const purchaseId = process.argv[2];
if (!purchaseId || process.argv.length !== 3) {
  console.error("Usage: node scripts/retry-access-email.mjs <purchase-id>");
  process.exit(1);
}
process.env.QUIZ_NO_LISTEN = "1";
const { retryAccessEmail } = await import("../app-secure.js");
const outcome = await retryAccessEmail(purchaseId);
console.log(JSON.stringify({ purchaseId, emailStatus: outcome.status }));

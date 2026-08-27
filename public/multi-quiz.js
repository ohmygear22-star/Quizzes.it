(() => {
  const app = document.getElementById("app");
  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const money = (amount, currency) => new Intl.NumberFormat("en-HK", { style: "currency", currency: String(currency || "hkd").toUpperCase() }).format(Number(amount || 0) / 100);
  const track = (event, detail = {}) => window.dispatchEvent(new CustomEvent("quiz-flow", { detail: { event, ...detail } }));

  async function getJson(path, options) {
    const response = await fetch(path, options);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to continue");
    return body;
  }

  function render(html) {
    app.innerHTML = '<section class="wrap">' + html + "</section>";
  }

  function go(nextRoute) {
    if (location.hash.slice(1) === nextRoute) return route();
    location.hash = nextRoute;
  }

  function landing() {
    document.title = "Quizzes it";
    render('<section class="hero"><div class="content"><p class="ey">PRIVATE SELF-DISCOVERY</p><h1>What do you protect when no one is watching?</h1><p class="lead">Start with a free five-question preview. Unlock the complete personal analysis only if you want to continue.</p><div class="intro"><div class="mark">☆</div><div><strong>Find your hidden pattern</strong><span>Start free · full analysis HK$29</span></div></div><button class="primary" onclick="window.multiQuizGo(\'catalog\')">Start free preview →</button><p class="micro">No sign-up to begin. Private paid access by email.</p></div></section>');
  }

  async function catalogue() {
    render('<section class="page"><p class="ey">ALL QUIZZES</p><h1>Find the question that follows you around.</h1><p class="lead">Loading available quizzes…</p></section>');
    try {
      const { quizzes } = await getJson("/api/quizzes");
      const rows = quizzes.map((quiz, index) => {
        const meta = quiz.metadata;
        const offer = quiz.offers[0];
        return '<article class="row"><small>' + String(index + 1).padStart(2, "0") + '</small><div><h2>' + escapeHtml(meta.title) + '</h2><p>' + escapeHtml(meta.description) + '</p><small class="catalogue-meta">5 free questions · ' + escapeHtml(quiz.flow?.questionRange || meta.questionRange || "Adaptive questions") + '</small></div><button class="primary" onclick="window.multiQuizGo(\'quiz/' + escapeHtml(quiz.slug) + '\')">View quiz →</button></article>';
m["zh-Hant"]["Adaptive 20-30 questions"]="自適應 20–30 條問題";
m["zh-Hant"]["About 6–9 minutes"]="約 6–9 分鐘";
m["zh-Hant"]["Your early insight is free. Full personalized analysis costs HK$29.00."]="你的初步洞察免費；完整個人分析費用為 HK$29.00。";
      }).join("");
      render('<section class="page"><p class="ey">ALL QUIZZES</p><h1>Find the question that follows you around.</h1><p class="lead catalogue-offer">Start free · 5 preview questions · full analysis HK$29.00</p><div class="list">' + rows + "</div></section>");
    } catch (error) {
      render('<section class="page"><h1>Quizzes are unavailable right now.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>");
    }
  }

  async function detail(slug) {
    track("product_page_viewed", { slug });
    render('<section class="page"><p class="ey">QUIZ</p><h1>Loading…</h1></section>');
    try {
      const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
      const meta = quiz.metadata;
      const offer = quiz.offers[0];
      document.title = quiz.seo?.title || meta.title + " | Quizzes it";
      render('<section class="page"><button class="back" onclick="window.multiQuizGo(\'catalog\')">← Back</button><p class="ey">' + escapeHtml(meta.category) + '</p><h1>' + escapeHtml(meta.title) + '</h1><p class="lead">' + escapeHtml(meta.description) + '</p><div class="facts"><span>' + escapeHtml(quiz.flow?.questionRange || meta.questionRange || "12 questions") + '</span><span>About ' + escapeHtml(meta.durationMinutes || "—") + ' minutes</span></div><button class="primary" onclick="window.multiQuizGo(\'preview/' + escapeHtml(quiz.slug) + '\')">Start free preview →</button><p class="micro">Your early insight is free. Full personalized analysis costs ' + money(offer.amount, offer.currency) + '.</p></section>');
    } catch (error) {
      render('<section class="page"><h1>Quiz not found.</h1></section>');
    }
  }

  async function preview(slug) {
    track("preview_started", { slug });
    render('<section class="page"><p class="ey">FREE PREVIEW</p><h1>Loading your first questions…</h1></section>');
    try {
      const data = await getJson("/api/quizzes/" + encodeURIComponent(slug) + "/preview");
      const answers = [];
      function ask(index) {
        const question = data.questions[index];
        const previous = index > 0 ? '<button type="button" class="back question-back" onclick="window.multiPreviewPrevious()">← Previous question</button>' : "";
      render('<section class="page"><p class="ey">FREE PREVIEW · ' + (index + 1) + ' OF ' + data.questions.length + '</p><div class="progress" aria-label="Preview progress"><span style="width:' + (((index + 1) / data.questions.length) * 100) + '%"></span></div><h1 class="question-title">' + escapeHtml(question.text) + '</h1><p class="lead">Go with your first instinct.</p><div class="answers">' + question.options.map((option) => '<button class="answer" onclick="window.multiPreviewPick(\'' + escapeHtml(option.id) + '\')">' + escapeHtml(option.text) + ' →</button>').join("") + "</div></section>");
      }
      window.multiPreviewPrevious = () => { if (!answers.length) return; answers.pop(); ask(answers.length); };
    window.multiPreviewPick = async (optionId) => {
        const question = data.questions[answers.length];
        answers.push(data.adaptive ? { questionId: question.id, optionId } : optionId);
        if (answers.length < data.questions.length) return ask(answers.length);
        try {
          const result = await getJson("/api/quizzes/" + encodeURIComponent(slug) + "/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
          track("preview_completed", { slug });
          teaser(slug, result.teaser);
        } catch (error) {
          render('<section class="page"><h1>We could not create your preview.</h1><p class="lead">' + escapeHtml(error.message) + '</p><button class="primary" onclick="window.multiQuizGo(\'preview/' + escapeHtml(slug) + '\')">Try again →</button></section>');
        }
      };
      ask(0);
    } catch (error) {
      render('<section class="page"><h1>Preview unavailable.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>");
    }
  }

  async function teaser(slug, insight) {
    track("paywall_viewed", { slug });
    const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
    const offer = quiz.offers[0];
    render('<section class="page teaser-page"><p class="ey">EARLY SIGNAL — NOT YOUR FINAL RESULT</p><h1 class="teaser-title">There is more to see in your pattern.</h1><p class="lead">' + escapeHtml(insight.observation) + '</p><p class="teaser-curiosity">' + escapeHtml(insight.next) + '</p><button class="primary" onclick="window.multiQuizGo(\'checkout/' + escapeHtml(slug) + '\')">Unlock my full analysis — ' + money(offer.amount, offer.currency) + ' →</button><p class="micro">Private link by email · available for 7 days.</p></section>');
  }

  async function checkout(slug) {
    const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
    const offer = quiz.offers[0];
    render('<section class="page"><p class="ey">UNLOCK FULL ANALYSIS — ' + money(offer.amount, offer.currency) + '</p><h1>Continue from where you left off.</h1><p class="lead">Your preview answers are saved. After payment, your private email link resumes the adaptive questions and keeps your completed reflection available for seven days.</p><form class="form" id="checkout-form" novalidate><label for="checkout-email">Email for your private access link</label><input id="checkout-email" type="email" autocomplete="email" placeholder="you@example.com" required><button class="primary">Continue to secure payment →</button><p class="micro" id="checkout-status" role="alert"></p></form></section>');
    document.getElementById("checkout-form").onsubmit = async (event) => {
      event.preventDefault();
      const status = document.getElementById("checkout-status");
      status.textContent = "Opening secure checkout…";
      try {
        track("checkout_started", { slug });
        const result = await getJson("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: document.getElementById("checkout-email").value, quizSlug: slug, offerId: offer.id }) });
        location.assign(result.checkoutUrl);
      } catch (error) {
        status.textContent = error.message;
      }
    };
  }

  async function access(token, mode = "resume") {
    render('<section class="page"><p class="ey">PRIVATE ACCESS</p><h1>Loading your quiz…</h1></section>');
    try {
      const data = await getJson("/api/access/" + encodeURIComponent(token));
      track(mode === "retake" ? "paid_quiz_retake_started" : "paid_quiz_resumed", { quizId: data.quiz.id });
      if (data.adaptive) return adaptiveAccess(token, data, mode);
      if (data.completed && mode !== "retake") return fullResult(data, token);
      const answers = [];
      const start = mode === "retake" ? 0 : (data.previewAnswerCount || 0);
      function ask(index) {
        const question = data.questions[index];
        const label = mode === "retake" ? "RETAKE QUIZ" : "CONTINUE QUIZ";
        const previous = answers.length ? '<button type="button" class="back question-back" onclick="window.multiAccessPrevious()">← Previous question</button>' : "";
      render('<section class="page"><p class="ey">' + label + ' · ' + (index + 1) + ' OF ' + data.questions.length + '</p><h1 class="question-title">' + escapeHtml(question.text) + '</h1><div class="answers">' + question.options.map((option) => '<button class="answer" onclick="window.multiAccessPick(\'' + escapeHtml(option.id) + '\')">' + escapeHtml(option.text) + ' →</button>').join("") + "</div></section>");
      }
      window.multiAccessPrevious = () => { if (!answers.length) return; answers.pop(); ask(start + answers.length); };
    window.multiAccessPick = async (optionId) => {
        answers.push(optionId);
        const index = start + answers.length;
        if (index < data.questions.length) return ask(index);
        const result = await getJson("/api/access/" + encodeURIComponent(token) + "/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, retake: mode === "retake" })
        });
        track("full_quiz_completed", { quizId: data.quiz.id, retake: mode === "retake" });
        fullResult({ completed: result, expiresAt: data.expiresAt }, token);
      };
      ask(start);
    } catch (error) {
      render('<section class="page"><h1>This link is unavailable.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>");
    }
  }
  async function adaptiveAccess(token, data, mode) {
    const answers = mode === "retake" ? [] : [...(data.resumeAnswers || data.previewAnswers || [])];
 let requestInFlight = false;
 async function ask() {
 if (requestInFlight) return;
 requestInFlight = true;
 try {
      const step = await getJson("/api/access/" + encodeURIComponent(token) + "/next", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, retake: mode === "retake" }) });
      if (step.complete) {
        const result = await getJson("/api/access/" + encodeURIComponent(token) + "/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, retake: mode === "retake" }) });
        track("full_quiz_completed", { quizId: data.quiz.id, retake: mode === "retake" });
        return fullResult({ completed: result.completed, expiresAt: data.expiresAt, quiz: data.quiz }, token);
      }
      const question = step.question;
      const previewCount = mode === "retake" ? 0 : (data.previewAnswers || []).length;
      const previous = answers.length > previewCount ? '<button type="button" class="back question-back" onclick="window.multiAdaptivePrevious()">← Previous question</button>' : "";
      render('<section class="page"><p class="ey">ADAPTIVE QUIZ · '+ escapeHtml(data.quiz.questionRange || "15–20 questions") + '</p><h1 class="question-title">' + escapeHtml(question.text) + '</h1><p class="lead">Your next question follows what you have already told us. You can go back before you continue.</p><div class="answers">' + question.options.map((option) => '<button class="answer" onclick="window.multiAdaptivePick(\'' + escapeHtml(option.id) + '\')">' + escapeHtml(option.text) + ' →</button>').join("") + "</div></section>");
      window.multiAdaptivePrevious = () => { if (requestInFlight || answers.length <= previewCount) return; answers.pop(); ask().catch((error) => render('<section class="page"><h1>We could not continue.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>")); };
      window.multiAdaptivePick = (optionId) => { if (requestInFlight) return; answers.push({ questionId: question.id, optionId }); ask().catch((error) => render('<section class="page"><h1>We could not continue.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>")); };
 } finally {
 requestInFlight = false;
 }
 }
 try { await ask(); } catch (error) { render('<section class="page"><h1>This link is unavailable.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>"); }
  }

  function fullResult(data, token) {
  track("result_viewed");
  const result = data.completed.result;
  if (result && Array.isArray(result.phases)) {
    const headline = result.phases[0]?.content || result.phases[0]?.body || "Your result";
    const supportingPhases = result.phases.slice(1);
    const phaseCards = supportingPhases.map((phase) => '<div class="card"><p class="ey">' + escapeHtml(phase.title || phase.name || phase.id || "Reflection") + '</p><p>' + escapeHtml(phase.content || phase.body || phase.text || "") + '</p></div>').join("");
    const evidenceCards = (result.evidenceMoments || []).map((moment) => '<li>' + escapeHtml(moment.questionText || moment.question || moment.text || "") + '</li>').join("");
    const confidence = result.confidence?.state || result.confidence?.label || result.confidence?.wording || result.confidence || (result.mixedProfile ? "A mixed pattern is emerging." : "A pattern is taking shape.");
    const availability = data.expiresAt ? "This private result remains available for seven days from purchase." : "Keep this link private so you can return when you are ready.";
    window.multiQuizRetake = () => render('<section class="page"><p class="ey">RETAKE YOUR QUIZ</p><h1>Start a fresh reflection?</h1><p class="lead">A retake will replace the saved result for this private link.</p><div class="result-actions"><button type="button" class="back" onclick="window.multiQuizReturnToResult()">Keep this result</button><button type="button" class="primary" onclick="window.multiQuizConfirmRetake()">Start retake</button></div></section>');
    window.multiQuizReturnToResult = () => fullResult(data, token);
    window.multiQuizConfirmRetake = () => access(token, "retake");
    const retakeControl = token ? '<button type="button" class="secondary" onclick="window.multiQuizRetake()">Retake this quiz</button>' : "";
    render('<section class="page result-page"><p class="ey">YOUR PRIVATE REFLECTION</p><p class="micro">' + escapeHtml(data.quiz?.title || "") + '</p><h1>' + escapeHtml(headline) + '</h1><p class="lead">' + escapeHtml(confidence) + '</p><div class="cards">' + phaseCards + '</div><section class="card evidence-card"><p class="ey">YOUR PATTERN, IN CONTEXT</p><h2>Questions that shaped your reflection</h2><ul>' + evidenceCards + '</ul></section><section class="card result-next"><p>' + escapeHtml(availability) + '</p><div class="result-actions">' + retakeControl + '</div></section><p class="micro">This is a private self-reflection result, not a diagnosis.</p></section>');
    return;
  }
  render('<section class="page"><h1>This result is unavailable.</h1><p class="lead">The saved result could not be read.</p></section>');
}

function route() {
    const path = location.pathname;
    const hash = location.hash.slice(1);
    if (path.startsWith("/access/") && hash) { location.replace("/#" + hash); return; }
    if (path.startsWith("/access/")) return access(path.split("/").pop());
    if (path === "/payment-success" && hash) { location.replace("/#" + hash); return; }
    if (path === "/payment-success") return render('<section class="page"><p class="ey">PAYMENT STATUS</p><h1>We are verifying your payment.</h1><p class="lead">Your private continuation link is emailed after Stripe confirms payment.</p></section>');
    if (path === "/payment-cancelled") return render('<section class="page"><h1>Nothing was charged.</h1><button class="primary" onclick="window.multiQuizGo(\'catalog\')">Return to quizzes →</button></section>');
    if (["how", "support", "privacy", "terms"].includes(hash) && typeof window.draw === "function") return window.draw();
    if (hash === "catalog") return catalogue();
    if (hash.startsWith("quiz/")) return detail(hash.slice(5));
    if (hash.startsWith("preview/")) return preview(hash.slice(8));
    if (hash.startsWith("checkout/")) return checkout(hash.slice(9));
    return landing();
  }

  window.go = go;
  window.multiQuizGo = go;
  window.onhashchange = route;
  route();
})();
(() => { const choices = [["en","English"],["zh-Hant","繁體中文"]]; const key = "quizzes.locale"; const pick = (value) => choices.some(([id]) => id === value) ? value : null; const browser = navigator.language || ""; const inferred = browser === "zh" || /zh-(HK|TW|MO)/i.test(browser) ? "zh-Hant" : "en"; let locale = pick(localStorage.getItem(key)) || inferred; const apply = (value) => { locale = pick(value) || "en"; localStorage.setItem(key, locale); document.documentElement.lang = locale; const button = document.querySelector(".lang"); if (button) button.textContent = choices.find(([id]) => id === locale)[1]; }; const button = document.querySelector(".lang"); if (!button) return; button.setAttribute("aria-haspopup", "menu"); button.setAttribute("aria-expanded", "false"); const menu = document.createElement("div"); menu.setAttribute("role", "menu"); menu.hidden = true; menu.style.cssText = "position:absolute;right:24px;top:82px;z-index:10;padding:8px;background:#171717;border:1px solid rgba(245,238,227,.25);border-radius:12px"; choices.forEach(([id,label]) => { const item = document.createElement("button"); item.type = "button"; item.setAttribute("role","menuitemradio"); item.style.cssText = "display:block;width:100%;padding:10px 14px;border:0;background:none;color:#f5eee3;text-align:left"; item.textContent = label; item.onclick = () => { apply(id); close(); button.focus(); }; menu.append(item); }); const close = () => { menu.hidden = true; button.setAttribute("aria-expanded","false"); }; button.after(menu); button.onclick = () => { menu.hidden = !menu.hidden; button.setAttribute("aria-expanded", String(!menu.hidden)); if (!menu.hidden) menu.querySelector("button").focus(); }; document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); }); apply(locale); })();

;(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    let url = typeof input === "string" ? input : input.url;
    const endpoint = url.split("?")[0];
    if (!/\/api\/(quizzes\/[^/]+\/preview|checkout)$/.test(endpoint)) return nativeFetch(input, init);
    const locale = localStorage.getItem("quizzes.locale") || "en";
    const method = (init.method || "GET").toUpperCase();
    if (method === "GET") {
      url += (url.includes("?") ? "&" : "?") + "locale=" + encodeURIComponent(locale);
      return nativeFetch(url, init);
    }
    let body = init.body;
    try { body = JSON.stringify({ ...JSON.parse(body || "{}"), locale }); } catch (_) {}
    return nativeFetch(url, { ...init, body, headers: { ...init.headers, "Content-Type": "application/json" } });
  };
})();
/* QUIZES_SHELL_LOCALE_PATCH_V2 */(()=>{const m={en:{'PRIVATE SELF-DISCOVERY':'PRIVATE SELF-DISCOVERY','What do you protect when no one is watching?':'What do you protect when no one is watching?','Start with a free five-question preview. Unlock the complete personal analysis only if you want to continue.':'Start with a free five-question preview. Unlock the complete personal analysis only if you want to continue.','Find your hidden pattern':'Find your hidden pattern','Start free · full analysis HK$29':'Start free · full analysis HK$29','Start free preview →':'Start free preview →','No sign-up to begin. Private paid access by email.':'No sign-up to begin. Private paid access by email.','ALL QUIZZES':'ALL QUIZZES','Find the question that follows you around.':'Find the question that follows you around.','Start free · 5 preview questions · full analysis HK$29.00':'Start free · 5 preview questions · full analysis HK$29.00','View quiz →':'View quiz →','Coming soon':'Coming soon','How it works':'How it works','All quizzes':'All quizzes','Support':'Support','Privacy':'Privacy','Terms':'Terms','Choose this quiz →':'Choose this quiz →'},'zh-Hant':{'PRIVATE SELF-DISCOVERY':'私人自我探索','What do you protect when no one is watching?':'沒有人看見時，你在保護甚麼？','Start with a free five-question preview. Unlock the complete personal analysis only if you want to continue.':'先免費回答五條預覽問題；如果想繼續，再解鎖完整個人分析。','Find your hidden pattern':'發現你的內在模式','Start free · full analysis HK$29':'免費開始 · 完整分析 HK$29','Start free preview →':'開始免費預覽 →','No sign-up to begin. Private paid access by email.':'不用註冊即可開始。付款後會以電郵提供私人存取連結。','ALL QUIZZES':'所有測驗','Find the question that follows you around.':'找出一直跟著你的那個問題。','Start free · 5 preview questions · full analysis HK$29.00':'免費開始 · 5 條預覽問題 · 完整分析 HK$29.00','View quiz →':'查看測驗 →','Coming soon':'即將推出','How it works':'測驗如何運作','All quizzes':'所有測驗','Support':'支援','Privacy':'私隱','Terms':'條款','Choose this quiz →':'選擇這個測驗 →'}};m["zh-Hant"]["← Back"]="← 返回";m["zh-Hant"]["EARLY SIGNAL — NOT YOUR FINAL RESULT"]="初步訊號 — 並非你的最終結果";m["zh-Hant"]["There is more to see in your pattern."]="你的模式還有更多值得了解。";m["zh-Hant"]["Unlock my full analysis — HK$29.00 →"]="解鎖我的完整分析 — HK$29.00 →";m["zh-Hant"]["Private link by email · available for 7 days."]="私人連結將透過電郵寄出 · 有效期 7 天。";m["zh-Hant"]["Are You Attached\u2014or Actually Compatible?"]="\u4f60\u662f\u4f9d\u6200\uff0c\u9084\u662f\u771f\u6b63\u5408\u62cd\uff1f";
m["zh-Hant"]["Adaptive 20-30 questions"]="自適應 20–30 條問題";
m["zh-Hant"]["About 6–9 minutes"]="約 6–9 分鐘";
m["zh-Hant"]["Your early insight is free. Full personalized analysis costs HK$29.00."]="你的初步洞察免費；完整個人分析費用為 HK$29.00。";
m["zh-Hant"]["Separate emotional attachment from real-life compatibility."]="\u5206\u8fa8\u60c5\u611f\u4f9d\u6200\u8207\u73fe\u5be6\u751f\u6d3b\u4e2d\u7684\u5951\u5408\u5ea6\u3002";
m["zh-Hant"]["What Red Flag Are You Most Likely to Explain Away?"]="\u4f60\u6700\u5bb9\u6613\u66ff\u54ea\u7a2e\u7d05\u65d7\u8b66\u8a0a\u627e\u85c9\u53e3\uff1f";
m["zh-Hant"]["See which warning signs you are most likely to rationalize."]="\u770b\u898b\u4f60\u6700\u5bb9\u6613\u5408\u7406\u5316\u7684\u8b66\u544a\u8a0a\u865f\u3002";
m["zh-Hant"]["Do You Want Love\u2014or Proof That You Matter?"]="\u4f60\u60f3\u8981\u7684\u662f\u611b\uff0c\u9084\u662f\u8b49\u660e\u81ea\u5df1\u503c\u5f97\u88ab\u611b\uff1f";
m["zh-Hant"]["Explore whether you want connection\u2014or reassurance of your worth."]="\u63a2\u7d22\u4f60\u6e34\u671b\u7684\u662f\u9023\u7d50\uff0c\u9084\u662f\u5c0d\u81ea\u8eab\u50f9\u503c\u7684\u78ba\u8a8d\u3002";
m["zh-Hant"]["5 free questions \u00b7 Adaptive 20-30 questions"]="\u0035 \u689d\u514d\u8cbb\u554f\u984c \u00b7 \u81ea\u9069\u61c9 \u0032\u0030\u2013\u0033\u0030 \u689d\u554f\u984c";
m["zh-Hant"]["5 free questions \u00b7 Adaptive 15-18 questions"]="\u0035 \u689d\u514d\u8cbb\u554f\u984c \u00b7 \u81ea\u9069\u61c9 \u0031\u0035\u2013\u0031\u0038 \u689d\u554f\u984c";
m["zh-Hant"]["View quiz →"] = "查看測驗 →";
m["zh-Hant"]["Adaptive 20-30 questions"]="自適應 20–30 條問題";
m["zh-Hant"]["About 6–9 minutes"]="約 6–9 分鐘";
m["zh-Hant"]["Your early insight is free. Full personalized analysis costs HK$29.00."]="你的初步洞察免費；完整個人分析費用為 HK$29.00。";
m["zh-Hant"]["Adaptive 20-30 questions"]="\u81ea\u9069\u61c9 20\u201330 \u689d\u554f\u984c";m["zh-Hant"]["About 6\u20139 minutes"]="\u7d04 6\u20139 \u5206\u9418";m["zh-Hant"]["Your early insight is free. Full personalized analysis costs HK$29.00."]="\u4f60\u7684\u521d\u6b65\u6d1e\u6089\u514d\u8cbb\uff1b\u5b8c\u6574\u500b\u4eba\u5206\u6790\u8cbb\u7528\u70ba HK$29.00\u3002";const originals=new WeakMap();const l=()=>localStorage.getItem('quizzes.locale')==='zh-Hant'?'zh-Hant':'en';const a=()=>{const x=m[l()],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n=[];while(w.nextNode())n.push(w.currentNode);n.forEach(t=>{if(!originals.has(t))originals.set(t,t.nodeValue);const raw=originals.get(t),v=raw.trim(),next=v&&x[v]?raw.replace(v,x[v]):raw;if(t.nodeValue!==next)t.nodeValue=next});document.documentElement.lang=l()};const r=()=>{if(typeof window.onhashchange==='function')window.onhashchange();setTimeout(a,0)};const q=document.getElementById('app');if(q)new MutationObserver(a).observe(q,{childList:true,subtree:true});a();document.addEventListener('click',e=>{if(e.target&&e.target.getAttribute('role')==='menuitemradio')setTimeout(r,0)});window.quizzesApplyShellLocale=a})()
// UX_LOCALE_REPAIR_V1
;(() => { if (!document.documentElement || typeof document.createTreeWalker !== "function") return;
  const hantCopy = new Map([
    ['FREE PREVIEW', '免費預覽'],
    ['Preview progress', '預覽進度'],
    ['Go with your first instinct.', '跟著第一個直覺。'],
    ['UNLOCK FULL ANALYSIS', '解鎖完整分析'],
    ['Continue from where you left off.', '從你剛才完成的地方繼續。'],
    ['Your preview answers are saved. After payment, your private email link resumes the adaptive questions and keeps your completed reflection available for seven days.', '你的預覽答案已儲存。付款後，私人電郵連結會帶你繼續完成自適應問題，並讓你在七天內保留已完成的反思。'],
    ['Email for your private access link', '接收私人存取連結的電郵'],
    ['you@example.com', 'you@example.com'],
    ['Continue to secure payment →', '繼續前往安全付款 →'],
    ['PAYMENT STATUS', '付款狀態'],
    ['We are verifying your payment.', '正在確認你的付款。'],
    ['Your private continuation link is emailed after Stripe confirms payment.', 'Stripe 確認付款後，我們會以電郵寄出你的私人繼續連結。'],
    ['YOUR PRIVATE REFLECTION', '你的私人反思'],
    ['clear', '清晰'],
    ["We're With You", '我們陪你一起'],
    ['The Deeper Pattern', '更深層的模式'],
    ['Professional / Real-World View', '專業／現實角度'],
    ['Evidence From Your Answers', '你的答案提供的線索'],
    ['Alternative Explanation & Confidence', '其他解釋與信心程度'],
    ['What This Looks Like in Real Life', '現實中的樣子'],
    ['What to Watch / Try Next', '接下來可以留意或嘗試'],
    ['YOUR PATTERN, IN CONTEXT', '你的模式，放在整體脈絡中'],
    ['Questions that shaped your reflection', '塑造你這次反思的問題'],
    ['This private result remains available for seven days from purchase.', '這份私人結果會由購買日起保留七天。'],
    ['Retake this quiz', '再次進行這個測驗'],
    ['This is a private self-reflection result, not a diagnosis.', '這是私人自我反思結果，並非診斷。'],
    ['ADAPTIVE QUIZ', '自適應測驗'],
    ['Your next question follows what you have already told us. You can go back before you continue.', '下一條問題會根據你之前的回答而來。你可以先返回，再繼續。'],
    ['Previous question', '上一條問題'],
    ['This link is no longer available.', '這個連結已無法使用。'],
    ['We could not continue.', '我們未能繼續。'],
  ]);
    ['Loading your quiz', '正在載入你的測驗…'],
    ['PRIVATE ACCESS', '私人存取']
  const replace = (value) => {
    let next = value;
    for (const [from, to] of hantCopy) next = next.split(from).join(to);
  if (next.startsWith('免費預覽 ·')) next = next.replace(' OF ', '／'); if (next === 'Preview progress') next = '預覽進度';
    return next;
  };
  const apply = () => {
    if (document.documentElement.lang !== 'zh-Hant') return;
    const root = document.getElementById('app') || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const next = replace(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    if (typeof root.querySelectorAll === 'function') root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
      el.placeholder = replace(el.placeholder);
    });
    const heading = typeof root.querySelector === 'function' ? root.querySelector('.question-title, .result h1') : null;
  if (typeof root.querySelectorAll === 'function') root.querySelectorAll('[aria-label="Preview progress"]').forEach((el) => el.setAttribute('aria-label','預覽進度'));
    if (heading && window.matchMedia('(max-width: 620px').matches) {
      heading.style.fontSize = 'clamp(2.25rem, 10vw, 4rem)';
      heading.style.lineHeight = '1.08';
            heading.style.maxWidth = '18ch';
    }
  };
  if (typeof window.addEventListener === 'function') window.addEventListener('quiz-flow', apply);
  new MutationObserver(apply).observe(document.getElementById('app') || document.body, {childList:true, subtree:true});
  window.quizzesApplyUxLocaleRepair = apply;
  apply();
})();
(()=>{if(typeof document==="undefined")return;document.querySelectorAll=document.querySelectorAll||(()=>[]);const m={"All quizzes":"所有測驗","How it works":"運作方式","Support":"支援","Privacy":"私隱","Terms":"條款","PRIVATE SELF-DISCOVERY":"私人自我探索","What do you protect when no one is watching?":"當沒有人看見時，你會守護什麼？","A thoughtful, playful read on the instinct beneath your choices.":"以細膩而有趣的方式，探索你選擇背後的直覺。","Find your hidden pattern":"找出你的隱藏模式","12 questions · around 3 minutes":"12 條問題 · 約 3 分鐘","Choose this quiz →":"選擇此測驗 →","Private access by email. No sign-up required.":"以電郵取得私人連結。不需註冊。","ALL QUIZZES":"所有測驗","Find the question that follows you around.":"找出那個一直縈繞心頭的問題。","One quiet moment. One honest answer at a time.":"給自己一個安靜片刻，一次誠實回答一題。","View quiz →":"查看測驗 →","Coming soon":"即將推出","How do You Seek Recognition?":"你如何尋求認同？","Explore the instinct beneath validation, attention and vulnerability.":"探索認同、關注與脆弱感背後的直覺。","Private email access for 7 days":"私人電郵連結有效 7 天","one-time payment. No sign-up required.":"一次性付款。不需註冊。","All purchases are final — no refunds or exchanges after payment, except where required by law.":"所有購買均為最終交易；付款後不設退款或換貨，法律另有規定除外。","HOW IT WORKS":"運作方式","Simple by design.":"簡單而清晰。","Choose a quiz":"選擇測驗","Start with the question you are curious about.":"從你最想了解的問題開始。","Answer 5 free questions":"回答 5 條免費問題","Receive an early signal before deciding whether to continue.":"先取得初步提示，再決定是否繼續。","Unlock for HK$29":"以 HK$29 解鎖","Use secure checkout only when you want the full analysis.":"只在你想取得完整分析時，使用安全付款。","Continue privately":"私密地繼續","We email a personal link for your remaining questions and result.":"我們會以電郵寄出完成其餘問題及查看結果的私人連結。","YOUR PRIVATE ACCESS":"你的私人連結","Where should we send your quiz link?":"你希望我們把測驗連結寄到哪裡？","After payment, we will email one secure link. It stays valid for 7 days.":"付款後，我們會以電郵寄出一條安全連結，有效期為 7 天。","Continue to secure payment →":"繼續安全付款 →","No sign-up. No mailing list. We use this only for purchase and access.":"不需註冊。不加入郵寄名單。我們只會將此電郵用於購買及存取。","PAYMENT STATUS PENDING":"付款狀態：處理中","We are verifying your payment.":"我們正在確認你的付款。","Your quiz link is emailed only after Stripe confirms payment. If you have paid, allow a moment for confirmation.":"Stripe 確認付款後，我們才會以電郵寄出測驗連結。如你已完成付款，請稍候片刻以待確認。","Nothing was charged.":"未有收取任何費用。","This link is no longer available.":"此連結已失效。","Your result":"你的結果","GO WITH YOUR FIRST INSTINCT":"跟隨你的第一直覺","YOUR PRIVATE REFLECTION":"你的私人反思","Evidence From Your Answers":"從你的回答得到的線索","Alternative Explanation & Confidence":"其他解釋與可信程度","What This Looks Like in Real Life":"在現實生活中的樣子","What to Watch / Try Next":"接下來可以留意或嘗試","What Red Flag Are You Most Likely to Explain Away?":"你最可能把哪種警號合理化？","Do You Want Love—or Proof That You Matter?":"你想要的是愛，還是證明自己重要？","Explore whether you want connection—or reassurance of your worth.":"探索你尋求的是連結，還是對自身價值的肯定。"};const run=()=>{if(document.documentElement.lang!=="zh-Hant")return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const a=[];while(w.nextNode())a.push(w.currentNode);a.forEach(n=>{const t=n.nodeValue.trim();if(m[t])n.nodeValue=n.nodeValue.replace(t,m[t])});document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(e=>["placeholder","aria-label","title"].forEach(k=>{const v=e.getAttribute(k);if(v&&m[v])e.setAttribute(k,m[v])}))};run();new MutationObserver(run).observe(document.body,{subtree:true,childList:true});})();/* Mobile Hant wording refinement */
(function(){
  if (typeof document === "undefined" || !document.documentElement || document.documentElement.lang !== "zh-Hant") return;
  var replacements = {
    "5 條免費問題 · 自適應 20–30 條問題": "5 條免費預覽題目 · 延伸題目約 20–30 條",
    "自適應 20–30 條問題": "延伸題目約 20–30 條",
    "自適應 20-30 條問題": "延伸題目約 20–30 條",
    "私人連結將透過電郵寄出 · 有效期 7 天。": "我們會透過電郵寄出私人連結，有效期為 7 天。"
  };
  var root = document.body;
  if (!root || root.nodeType !== 1 || !document.createTreeWalker) return;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = walker.nextNode())) {
    if (typeof node.nodeValue !== "string") continue; var text = node.nodeValue;
    Object.keys(replacements).forEach(function(key){
      if (text.indexOf(key) !== -1) text = text.split(key).join(replacements[key]);
    });
    node.nodeValue = text;
  }
})();/* Mobile Hant wording observer */
(function(){
  if (typeof document === "undefined" || !document.documentElement || document.documentElement.lang !== "zh-Hant") return;
  var replacements = {
    "5 條免費問題 · 自適應 20–30 條問題": "5 條免費預覽題目 · 延伸題目約 20–30 條",
    "5 條免費問題 · 自適應 15–18 條問題": "5 條免費預覽題目 · 延伸題目約 15–18 條",
    "自適應 20–30 條問題": "延伸題目約 20–30 條",
    "自適應 15–18 條問題": "延伸題目約 15–18 條",
    "私人連結將透過電郵寄出 · 有效期 7 天。": "我們會透過電郵寄出私人連結，有效期為 7 天。"
  };
  function apply(){
    var root = document.body;
    if (!root || root.nodeType !== 1 || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (typeof node.nodeValue !== "string") continue;
      var text = node.nodeValue;
      Object.keys(replacements).forEach(function(key){
        if (text.indexOf(key) !== -1) text = text.split(key).join(replacements[key]);
      });
      node.nodeValue = text;
    }
  }
  apply();
  if (typeof MutationObserver === "function" && document.body) {
    new MutationObserver(apply).observe(document.body, {subtree:true, childList:true});
  }
})();
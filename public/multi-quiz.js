(() => {
  const app = document.getElementById("app");
 const CATALOG_PAGE_SIZE = 10;
 let catalogPage = 1;
 const activeLocale = () => { try { return localStorage.getItem("quizzes.locale") === "zh-Hant" ? "zh-Hant" : "en"; } catch (_) { return "en"; } };
 const ui = (english, hant) => activeLocale() === "zh-Hant" ? hant : english;
 const RESPONSIVE_UX_V1_PRODUCTION = true;
  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const money = (amount, currency) => new Intl.NumberFormat("en-HK", { style: "currency", currency: String(currency || "hkd").toUpperCase() }).format(Number(amount || 0) / 100);
  const track = (event, detail = {}) => window.dispatchEvent(new CustomEvent("quiz-flow", { detail: { event, ...detail } }));

  async function getJson(path, options) {
    const previewGet = typeof path === "string" && /^\/api\/quizzes\/[^/]+\/preview(?:\?|$)/.test(path) && String(options?.method || "GET").toUpperCase() === "GET";
    const requestPath = previewGet ? path + (path.includes("?") ? "&" : "?") + "locale=" + encodeURIComponent(activeLocale()) : path;
    const response = await fetch(requestPath, options);
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
 render('<section class="hero"><div class="content"><p class="ey">' + ui("PERSONAL REFLECTION QUIZZES", "個人反思測驗") + '</p><h1>' + ui("What do you protect when no one is watching?", "沒有人看見時，你在保護甚麼？") + '</h1><p class="lead">' + ui("Start with five-question preview. Unlock the complete personal analysis only if you want to continue.", "先回答五條題目；如果想繼續，再解鎖完整個人分析。") + '</p><div class="homeMeta"><span>' + ui("","") + '</span><span>' + ui("About 6–9 minutes", "約 6–9 分鐘") + '</span><span>HK$29 · ' + ui("one-time", "") + '</span></div><button type="button" class="primary" id="home-start">' + ui("Start the quiz", "開始測驗") + ' →</button><p class="micro">' + ui("No sign-up to begin. Private access by email.", "無需註冊。完成付款後，我們會以電郵提供私人存取連結。") + '</p></div></section>');
 document.getElementById("home-start").onclick = () => go("catalog");
 }

 function publicCopy(quiz) {
 const meta = quiz.metadata || {};
 const hant = activeLocale() === "zh-Hant";
 const title = hant ? (quiz.title?.["zh-Hant"] || meta.titleZh || meta.title) : (quiz.title?.en || meta.title);
 const description = hant ? (quiz.description?.["zh-Hant"] || meta.descriptionZh || meta.description) : (quiz.description?.en || meta.description);
 const sourceQuestionRange = quiz.flow?.questionRange || meta.questionRange || "Adaptive questions";
 const questionRange = hant ? ({ "Adaptive 20–30 questions": "自適應 20–30 條問題", "Adaptive 15–18 questions": "自適應 15–18 條問題", "Adaptive questions": "自適應問題" }[sourceQuestionRange] || sourceQuestionRange) : sourceQuestionRange;
 const previewLabel = hant ? "5 條免費問題" : "5 free questions";
 const duration = meta.durationMinutes || "—";
 const durationLabel = hant ? "約 " + duration + " 分鐘" : "About " + duration + " minutes";
 return { ...meta, title, description, questionRange, previewLabel, durationLabel };
}

async function catalogue() {
 document.title = ui("All quizzes | Quizzes it", "所有測驗 | Quizzes it");
 render('<section class="page catalogPage"><p class="ey">' + ui("ALL QUIZZES", "所有測驗") + '</p><h1>' + ui("Find the question that follows you around.", "找出一直跟著你的那個問題。") + '</h1><p class="lead">' + ui("Loading available quizzes…", "正在載入測驗…") + '</p></section>');
 try {
 const { quizzes } = await getJson("/api/quizzes");
 const pageCount = Math.max(1, Math.ceil(quizzes.length / CATALOG_PAGE_SIZE));
 const safePage = Math.min(Math.max(1, catalogPage), pageCount);
 catalogPage = safePage;
 const start = (safePage - 1) * CATALOG_PAGE_SIZE;
 const rows = quizzes.slice(start, start + CATALOG_PAGE_SIZE).map((quiz, localIndex) => {
 const meta = publicCopy(quiz);
 const itemNumber = start + localIndex + 1;
 return '<article class="card"><small class="number">' + String(itemNumber).padStart(2, "0") + '</small><div class="cardCopy"><h2>' + escapeHtml(meta.title) + '</h2><p>' + escapeHtml(meta.description) + '</p></div><button type="button" class="primary catalogCta" data-quiz-slug="' + escapeHtml(quiz.slug) + '">' + ui("View quiz", "查看測驗") + ' →</button></article>';
 }).join("");
 const pagination = pageCount > 1 ? '<nav class="catalogPagination" aria-label="' + ui("Quiz catalogue pages", "測驗目錄頁碼") + '">' + Array.from({ length: pageCount }, (_, index) => { const page = index + 1; const current = page === safePage; return '<button type="button"' + (current ? ' disabled aria-current="page"' : ' data-catalog-page="' + page + '"') + '>' + page + '</button>'; }).join("") + '</nav>' : "";
 render('<section class="page catalogPage"><p class="ey">' + ui("ALL QUIZZES", "所有測驗") + '</p><h1>' + ui("Find the question that follows you around.", "找出一直跟著你的那個問題。") + '</h1><p class="lead">' + ui("Begin with five questions. Unlock your full analysis only if it is useful to you.", "先回答五條題目；只有當完整分析對你有幫助時，才需要解鎖。") + '</p><div class="cards">' + rows + '</div>' + pagination + '</section>');
 document.querySelectorAll("[data-quiz-slug]").forEach((button) => { button.onclick = () => go("quiz/" + button.dataset.quizSlug); });
 document.querySelectorAll("[data-catalog-page]").forEach((button) => { button.onclick = () => window.setCatalogPage(button.dataset.catalogPage); });
 } catch (error) {
 render('<section class="page"><h1>' + ui("Quizzes are unavailable right now.", "目前未能載入測驗。") + '</h1><p class="lead">' + escapeHtml(error.message) + '</p></section>');
 }
 }
 window.setCatalogPage = (page) => { catalogPage = Math.max(1, Number(page) || 1); catalogue(); window.scrollTo({ top: 0, behavior: "smooth" }); };

 async function detail(slug) {
 track("product_page_viewed", { slug });
 render('<section class="page"><p class="ey">' + ui("QUIZ", "測驗") + '</p><h1>' + ui("Loading…", "正在載入…") + '</h1></section>');
 try {
 const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
 const meta = publicCopy(quiz);
 document.title = meta.title + " | Quizzes it";
 render('<section class="page detailPage"><button type="button" class="back catalogBack" id="detail-back">← ' + ui("Back to all quizzes", "返回全部測驗") + '</button><p class="ey">' + escapeHtml(meta.category || ui("QUIZ", "測驗")) + '</p><h1>' + escapeHtml(meta.title) + '</h1><p class="lead">' + escapeHtml(meta.description) + '</p><p class="detailDuration">' + escapeHtml(meta.durationLabel) + '</p><button type="button" class="primary" id="detail-start">' + ui("Start the quiz", "開始測驗") + ' →</button><p class="micro">' + ui("No sign-up to begin.", "無需註冊即可開始。") + '</p></section>');
 document.getElementById("detail-back").onclick = () => go("catalog");
 document.getElementById("detail-start").onclick = () => go("preview/" + quiz.slug);
 } catch (error) {
 render('<section class="page"><h1>' + ui("Quiz not found.", "找不到此測驗。") + '</h1></section>');
 }
 }

 const previewSessions = new Map();

async function preview(slug) {
 track("preview_started", { slug });
 const persisted = previewSessions.get(slug);
 if (persisted?.completed) return teaser(slug, persisted.teaser);
 render('<section class="page"><p class="ey">' + ui("QUESTION", "問題") + '</p><h1>' + ui("Loading your first questions…", "正在載入題目…") + '</h1></section>');
 try {
 const data = persisted?.data || await getJson("/api/quizzes/" + encodeURIComponent(slug) + "/preview");
 const state = persisted || { data, answers: [], completed: false, teaser: null };
 state.data = data;
 previewSessions.set(slug, state);
 const answers = state.answers;
 function ask(index) {
 const question = data.questions[index];
 const previous = index > 0 ? '<button type="button" class="back question-back" id="preview-previous">← ' + ui("Previous question", "上一條問題") + '</button>' : "";
 render('<section class="page question">' + previous + '<p class="ey">' + ui("QUESTION", "問題") + ' ' + (index + 1) + ' / ' + data.questions.length + '</p><div class="progress" aria-label="' + ui("Quiz progress", "測驗進度") + '"><span style="width:' + (((index + 1) / data.questions.length) * 100) + '%"></span></div><h1 class="question-title">' + escapeHtml(question.text) + '</h1><p class="lead questionHint">' + ui("Choose the answer that feels most true—not the most flattering.", "選擇最貼近你真實反應的答案，而不是最理想的答案。") + '</p><div class="answers">' + question.options.map((option) => '<button type="button" class="answer" data-option-id="' + escapeHtml(option.id) + '">' + escapeHtml(option.text) + ' →</button>').join("") + '</div></section>');
 const previousButton = document.getElementById("preview-previous");
 if (previousButton) previousButton.onclick = window.multiPreviewPrevious;
 document.querySelectorAll("[data-option-id]").forEach((button) => { button.onclick = () => window.multiPreviewPick(button.dataset.optionId); });
 }
 window.multiPreviewPrevious = () => { if (!answers.length) return; answers.pop(); ask(answers.length); };
 window.multiPreviewPick = async (optionId) => {
 const question = data.questions[answers.length];
 answers.push(data.adaptive ? { questionId: question.id, optionId } : optionId);
 if (answers.length < data.questions.length) return ask(answers.length);
 try {
 const result = await getJson("/api/quizzes/" + encodeURIComponent(slug) + "/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
 state.completed = true;
 state.teaser = result.teaser;
 track("preview_completed", { slug });
 teaser(slug, result.teaser);
 } catch (error) {
 render('<section class="page"><h1>' + ui("We could not save your answers.", "未能儲存你的答案。") + '</h1><p class="lead">' + escapeHtml(error.message) + '</p><button type="button" class="primary" id="preview-retry">' + ui("Try again", "再試一次") + ' →</button></section>');
 document.getElementById("preview-retry").onclick = () => go("preview/" + slug);
 }
 };
 ask(answers.length);
 } catch (error) {
 render('<section class="page"><h1>' + ui("Quiz unavailable.", "測驗暫時無法使用。") + '</h1><p class="lead">' + escapeHtml(error.message) + '</p></section>');
 }
 }

 async function teaser(slug, insight) {
 track("paywall_viewed", { slug });
 const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
 const offer = quiz.offers[0];
 const headline = insight?.headline || ui("Your early signal", "你的初步訊號");
 const observation = insight?.observation || ui("Your first five answers already point to a pattern worth looking at.", "你的首五個答案已經帶出一個值得再看的模式。");
 const curiosity = insight?.curiosity || ui("The remaining questions test whether that pattern holds in different situations.", "餘下問題會看看這個模式在不同情境中是否仍然成立。");
 const next = insight?.next || ui("Continue for the full reflection and the evidence behind it.", "繼續完成測驗，看看完整解讀和背後的答案證據。");
 render('<section class="page teaser-page"><p class="ey">' + ui("EARLY SIGNAL — NOT YOUR FINAL RESULT", "初步訊號 — 並非你的最終結果") + '</p><h1 class="teaser-title">' + escapeHtml(headline) + '</h1><p class="lead">' + escapeHtml(observation) + '</p><p class="teaser-curiosity">' + escapeHtml(curiosity) + ' ' + escapeHtml(next) + '</p><button type="button" class="primary" id="teaser-unlock">' + ui("Unlock my full analysis", "解鎖我的完整分析") + ' — ' + money(offer.amount, offer.currency) + ' →</button><p class="micro">' + ui("Private link by email · available for 7 days.", "私人連結會透過電郵寄出 · 有效期 7 天。") + '</p></section>');
 document.getElementById("teaser-unlock").onclick = () => go("checkout/" + slug);
 }

 async function checkout(slug) {
 const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
 const offer = quiz.offers[0];
 render('<section class="page paywall"><p class="ey">' + ui("UNLOCK FULL ANALYSIS", "解鎖完整分析") + '</p><h1>' + ui("Continue from where you left off.", "從剛才的地方繼續。") + '</h1><p class="lead">' + ui("Your answers are saved. After payment, your private link resumes the remaining questions.", "你的答案已儲存。付款後，私人連結會帶你繼續完成餘下題目。") + '</p><form class="form" id="checkout-form" novalidate><label for="checkout-email">' + ui("Email for your private access link", "接收私人存取連結的電郵") + '</label><input id="checkout-email" type="email" autocomplete="email" placeholder="you@example.com" required><button class="primary">' + ui("Continue to secure payment", "前往安全付款") + ' →</button><p class="micro" id="checkout-status" role="alert"></p></form><p class="micro">' + ui("Private link valid for 7 days", "付款 · 不設訂閱 · 私人連結有效期為 7 天") + '</p></section>');
 document.getElementById("checkout-form").onsubmit = async (event) => {
 event.preventDefault();
 const status = document.getElementById("checkout-status");
 status.textContent = ui("Opening secure checkout…", "正在開啟安全付款頁面…");
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
    render('<section class="page"><p class="ey">' + ui("PRIVATE ACCESS", "私人存取") + '</p><h1>' + ui("Loading your quiz…", "正在載入你的測驗…") + '</h1></section>');
    try {
      const data = await getJson("/api/access/" + encodeURIComponent(token));
      track(mode === "retake" ? "paid_quiz_retake_started" : "paid_quiz_resumed", { quizId: data.quiz.id });
      if (data.completed && mode !== "retake") return fullResult(data, token);
      if (data.adaptive) return adaptiveAccess(token, data, mode);
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
      const previous = answers.length > previewCount ? '<button type="button" class="back question-back" onclick="window.multiAdaptivePrevious()">← ' + ui("Previous question", "上一條問題") + '</button>' : "";
      render('<section class="page"><p class="ey">' + ui("ADAPTIVE QUIZ", "自適應測驗") + '</p>' + previous + '<h1 class="question-title">' + escapeHtml(question.text) + '</h1><p class="lead">' + ui("Your next question follows what you have already told us. You can go back before you continue.", "下一條問題會根據你之前的答案選出；繼續前仍可返回上一條。") + '</p><div class="answers">' + question.options.map((option) => '<button class="answer" onclick="window.multiAdaptivePick(\'' + escapeHtml(option.id) + '\')">' + escapeHtml(option.text) + ' →</button>').join("") + "</div></section>");
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
  if (result?.locale && typeof window.quizLocaleApply === "function") window.quizLocaleApply(result.locale, false);
  if (result && Array.isArray(result.phases)) {
    const hant = (result.locale || activeLocale()) === "zh-Hant";
    const rUi = (en, zh) => hant ? zh : en;
    const headline = result.truthPacket?.resultHeadline || result.phases[0]?.content || result.phases[0]?.body || rUi("Your result", "你的結果");
    const supportingPhases = result.phases.slice(1);
    const phaseCards = supportingPhases.map((phase, index) => '<article class="card result-phase-card"><p class="ey">' + String(index + 2).padStart(2, "0") + ' · ' + escapeHtml(phase.title || phase.name || phase.id || rUi("Reflection", "個人反思")) + '</p><p>' + escapeHtml(phase.content || phase.body || phase.text || "") + '</p></article>').join("");
    const packet = result.truthPacket;
    const resultValue = result.resultValue || null;
    const visibleEvidence = resultValue?.evidenceMoments || packet?.actualEvidence || result.evidenceMoments || [];
    const evidenceCards = visibleEvidence.map((moment) => '<article class="evidence-moment"><p class="ey evidence-label">' + rUi("QUESTION", "問題") + '</p><p class="evidence-question">' + escapeHtml(moment.questionText || moment.question || moment.text || "") + '</p><p class="ey evidence-label">' + rUi("THE SELECTED ANSWER", "你選擇的答案") + '</p><p class="evidence-answer">“' + escapeHtml(moment.optionText || "") + '”</p>' + (moment.whyItMattered ? '<p class="ey evidence-label">' + rUi("WHY IT MATTERED", "為甚麼這個答案重要") + '</p><p class="evidence-why">' + escapeHtml(moment.whyItMattered) + '</p>' : '') + '</article>').join("");
    const confidence = resultValue?.summary || result.confidence?.wording || result.confidence?.label || result.confidence || (result.mixedProfile ? rUi("More than one pattern matters here.", "這裡有多於一個值得留意的模式。") : rUi("One pattern carries more weight here.", "這裡有一個較有份量的模式。"));
    const meaningBody = Array.isArray(resultValue?.meaningParagraphs) ? resultValue.meaningParagraphs.map((paragraph) => '<p>' + escapeHtml(paragraph) + '</p>').join("") : "";
    const nextStepsBody = Array.isArray(resultValue?.nextSteps) ? resultValue.nextSteps.map((step) => '<li>' + escapeHtml(step) + '</li>').join("") : "";
    const changeBody = resultValue?.changeSignal ? escapeHtml(resultValue.changeSignal) : "";
    const voices = result.personalities || null;
    const voiceOrder = ["motivation", "therapist", "bestie", "darkTriad"];
    const voiceParagraphs = (voice) => Array.isArray(voice.paragraphs) ? voice.paragraphs : [voice.content, voice.evidence, voice.next].filter(Boolean);
    const voiceBody = (voice) => voiceParagraphs(voice).map((paragraph) => '<p class="personality-paragraph">' + escapeHtml(paragraph) + '</p>').join("");
    const voiceCard = (voice, key) => '<article class="card personality-card personality-' + key + '"><p class="ey">' + escapeHtml(voice.title) + '</p>' + voiceBody(voice) + '</article>';
    const voiceGrid = voices ? voiceOrder.map((key) => voiceCard(voices[key], key)).join("") : "";
    const voiceAccordion = voices ? voiceOrder.map((key, index) => { const voice = voices[key]; return '<details class="personality-accordion"' + (index === 0 ? ' open' : '') + '><summary>' + escapeHtml(voice.title) + '</summary><div>' + voiceBody(voice) + '</div></details>'; }).join("") : "";
    const consensusBody = result.consensus?.content ? escapeHtml(result.consensus.content) : "";
    const availability = data.expiresAt ? rUi("This private result remains available for seven days from purchase.", "這份私人結果由購買日起保留七天。") : rUi("Keep this link private so you can return when you are ready.", "請妥善保管這條私人連結，方便你之後回來查看。");
    window.multiQuizRetake = () => render('<section class="page"><p class="ey">' + rUi("RETAKE YOUR QUIZ", "重新測驗") + '</p><h1>' + rUi("Start a fresh reflection?", "重新開始一次反思？") + '</h1><p class="lead">' + rUi("A retake will replace the saved result for this private link.", "重新測驗會取代這條私人連結目前儲存的結果。") + '</p><div class="result-actions"><button type="button" class="back" onclick="window.multiQuizReturnToResult()">' + rUi("Keep this result", "保留目前結果") + '</button><button type="button" class="primary" onclick="window.multiQuizConfirmRetake()">' + rUi("Start retake", "開始重新測驗") + '</button></div></section>');
    window.multiQuizReturnToResult = () => fullResult(data, token);
    window.multiQuizConfirmRetake = () => access(token, "retake");
    const retakeControl = token ? '<button type="button" class="secondary" onclick="window.multiQuizRetake()">' + rUi("Retake this quiz", "重新做這個測驗") + '</button>' : "";
    const enhanced = packet && voices && result.consensus;
    if (enhanced) {
      const meaningSection = meaningBody ? '<section class="card result-meaning"><p class="ey">' + rUi("WHAT THIS MEANS FOR YOU", "這對你意味著甚麼") + '</p><div class="result-copy-stack">' + meaningBody + '</div></section>' : "";
      const actionSection = nextStepsBody ? '<section class="card result-actions-card"><p class="ey">' + rUi("WHAT TO DO NEXT", "接下來可以做甚麼") + '</p><ol class="result-steps">' + nextStepsBody + '</ol></section>' : "";
      const changeSection = changeBody ? '<section class="card result-change"><p class="ey">' + rUi("ONE THING THAT COULD CHANGE THIS RESULT", "一件可能改變這份結果的事") + '</p><p>' + changeBody + '</p></section>' : "";
      render('<section class="page result-page result-page-enhanced"><p class="ey">' + rUi("YOUR RESULT", "你的結果") + '</p><p class="micro">' + escapeHtml(data.quiz?.title || "") + '</p><h1>' + escapeHtml(headline) + '</h1><p class="lead">' + escapeHtml(confidence) + '</p><section class="card evidence-card"><p class="ey">' + rUi("WHY YOU GOT THIS RESULT", "你為甚麼得到這個結果") + '</p><h2>' + rUi("The answers that shaped this reflection", "形成這份解讀的答案") + '</h2><div class="evidence-list">' + evidenceCards + '</div></section>' + meaningSection + '<section class="personality-section"><p class="ey">' + rUi("FOUR WAYS TO READ YOUR RESULT", "從四個角度看你的結果") + '</p><div class="personality-grid">' + voiceGrid + '</div><div class="personality-accordions">' + voiceAccordion + '</div></section><section class="card result-consensus"><p class="ey">' + rUi("WHAT ALL FOUR AGREE ON", "四個角度的共同結論") + '</p><p>' + consensusBody + '</p></section>' + actionSection + changeSection + '<section class="card result-next"><p>' + escapeHtml(availability) + '</p><div class="result-actions">' + retakeControl + '</div></section><p class="micro">' + rUi("This is a private self-reflection result, not a diagnosis.", "這是一份私人自我反思結果，並非診斷。") + '</p></section>');
      return;
    }
    const legacy = '<p class="micro legacy-result-note">' + rUi("This saved result uses the original eight-phase format.", "這份已儲存結果會以原有八階段格式顯示。") + '</p>';
    render('<section class="page result-page result-page-legacy"><p class="ey">' + rUi("YOUR PRIVATE REFLECTION", "你的私人反思") + '</p><p class="micro">' + escapeHtml(data.quiz?.title || "") + '</p><h1>' + escapeHtml(headline) + '</h1><p class="lead">' + escapeHtml(confidence) + '</p><div class="result-phase-grid">' + phaseCards + '</div>' + legacy + '<section class="card result-next"><p>' + escapeHtml(availability) + '</p><div class="result-actions">' + retakeControl + '</div></section><p class="micro">' + rUi("This is a private self-reflection result, not a diagnosis.", "這是一份私人自我反思結果，並非診斷。") + '</p></section>');
    return;
  }
  render('<section class="page"><h1>' + rUi("This result is unavailable.", "暫時無法讀取這份結果。") + '</h1><p class="lead">' + rUi("The saved result could not be read.", "未能讀取已儲存的結果。") + '</p></section>');
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
 window.multiQuizRefresh = route;
  window.onhashchange = route;
  route();
})();
(() => {
 const choices = [["en", "EN"], ["zh-Hant", "CN"]];
 const key = "quizzes.locale";
 const read = () => { try { return localStorage.getItem(key); } catch (_) { return null; } };
 const write = (value) => { try { localStorage.setItem(key, value); } catch (_) {} };
 const browserLocale = navigator.language || "";
 const inferred = browserLocale === "zh" || /zh-(HK|TW|MO)/i.test(browserLocale) ? "zh-Hant" : "en";
 let locale = choices.some(([id]) => id === read()) ? read() : inferred;
 const shellCopy = { en: { catalog: "All quizzes", how: "How it works", support: "Support", privacy: "Privacy", terms: "Terms", menu: "Open menu", close: "Close menu", nav: "Mobile navigation", language: "Language", english: "English language", hant: "Traditional Chinese language" }, "zh-Hant": { catalog: "所有測驗", how: "測驗如何運作", support: "支援", privacy: "私隱", terms: "條款", menu: "開啟選單", close: "關閉選單", nav: "流動版導覽", language: "語言", english: "英文", hant: "繁體中文" } };
 const menu = document.getElementById("mobileMenu");
 const menuButton = document.querySelector(".menuBtn");
 const setMenu = (open) => { if (!menu || !menuButton) return; menu.classList.toggle("open", open); menuButton.setAttribute("aria-expanded", String(open)); menuButton.setAttribute("aria-label", shellCopy[locale][open ? "close" : "menu"]); menuButton.textContent = open ? "×" : "☰"; document.body.classList.toggle("menuOpen", open); };
 const apply = (value, refresh = false) => { locale = choices.some(([id]) => id === value) ? value : "en"; write(locale); document.documentElement.lang = locale; document.documentElement.classList.toggle("hant", locale === "zh-Hant"); const labels = shellCopy[locale]; document.querySelectorAll("[data-shell]").forEach((element) => { const label = labels[element.dataset.shell]; if (label) element.textContent = label; }); const group = document.querySelector(".languageSwitch"); if (group) group.setAttribute("aria-label", labels.language); document.querySelectorAll(".langChoice").forEach((button) => { const active = button.dataset.locale === locale; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); button.setAttribute("aria-label", button.dataset.locale === "en" ? labels.english : labels.hant); }); if (menu) menu.setAttribute("aria-label", labels.nav); setMenu(false); if (refresh && typeof window.multiQuizRefresh === "function") window.multiQuizRefresh(); };
 document.querySelectorAll(".langChoice").forEach((button) => { button.onclick = () => apply(button.dataset.locale, true); });
 document.querySelectorAll("[data-route]").forEach((button) => { button.onclick = () => { setMenu(false); if (typeof window.multiQuizGo === "function") window.multiQuizGo(button.dataset.route); }; });
 if (menuButton) menuButton.onclick = () => setMenu(!menu.classList.contains("open"));
 document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });
 document.addEventListener("click", (event) => { if (menu && menu.classList.contains("open") && !event.target.closest(".menuBtn") && !event.target.closest(".menu")) setMenu(false); });
 window.quizLocaleApply = apply;
 apply(locale, false);
})();



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
m["zh-Hant"]["Separate emotional attachment from real-life compatibility."]="\u5206\u8fa8\u60c5\u611f\u4f9d\u6200\u8207\u73fe\u5be6\u751f\u6d3b\u4e2d\u7684\u5951\u5408\u5ea6\u3002";
m["zh-Hant"]["What Red Flag Are You Most Likely to Explain Away?"]="\u4f60\u6700\u5bb9\u6613\u66ff\u54ea\u7a2e\u7d05\u65d7\u8b66\u8a0a\u627e\u85c9\u53e3\uff1f";
m["zh-Hant"]["See which warning signs you are most likely to rationalize."]="\u770b\u898b\u4f60\u6700\u5bb9\u6613\u5408\u7406\u5316\u7684\u8b66\u544a\u8a0a\u865f\u3002";
m["zh-Hant"]["Do You Want Love\u2014or Proof That You Matter?"]="\u4f60\u60f3\u8981\u7684\u662f\u611b\uff0c\u9084\u662f\u8b49\u660e\u81ea\u5df1\u503c\u5f97\u88ab\u611b\uff1f";
m["zh-Hant"]["Explore whether you want connection\u2014or reassurance of your worth."]="\u63a2\u7d22\u4f60\u6e34\u671b\u7684\u662f\u9023\u7d50\uff0c\u9084\u662f\u5c0d\u81ea\u8eab\u50f9\u503c\u7684\u78ba\u8a8d\u3002";
m["zh-Hant"]["5 free questions \u00b7 Adaptive 20-30 questions"]="\u0035 \u689d\u514d\u8cbb\u554f\u984c \u00b7 \u81ea\u9069\u61c9 \u0032\u0030\u2013\u0033\u0030 \u689d\u554f\u984c";
m["zh-Hant"]["5 free questions \u00b7 Adaptive 15-18 questions"]="\u0035 \u689d\u514d\u8cbb\u554f\u984c \u00b7 \u81ea\u9069\u61c9 \u0031\u0035\u2013\u0031\u0038 \u689d\u554f\u984c";
m["zh-Hant"]["View quiz →"] = "查看測驗 →";
m["zh-Hant"]["Adaptive 20-30 questions"]="自適應 20–30 條問題";
m["zh-Hant"]["Adaptive 20-30 questions"]="\u81ea\u9069\u61c9 20\u201330 \u689d\u554f\u984c";m["zh-Hant"]["About 6\u20139 minutes"]="\u7d04 6\u20139 \u5206\u9418";m["zh-Hant"]["Your early insight is free. Full personalized analysis costs HK$29.00."]="\u4f60\u7684\u521d\u6b65\u6d1e\u6089\u514d\u8cbb\uff1b\u5b8c\u6574\u500b\u4eba\u5206\u6790\u8cbb\u7528\u70ba HK$29.00\u3002";m["zh-Hant"]["Adaptive 15–18 questions"]="自適應 15–18 條問題";m["zh-Hant"]["About 5–7 minutes"]="約 5–7 分鐘";const originals=new WeakMap();const l=()=>localStorage.getItem('quizzes.locale')==='zh-Hant'?'zh-Hant':'en';const a=()=>{const x=m[l()],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n=[];while(w.nextNode())n.push(w.currentNode);n.forEach(t=>{if(!originals.has(t))originals.set(t,t.nodeValue);const raw=originals.get(t),v=raw.trim(),next=v&&x[v]?raw.replace(v,x[v]):raw;if(t.nodeValue!==next)t.nodeValue=next});if(document.documentElement.lang!==l())document.documentElement.lang=l()};const r=()=>{if(typeof window.onhashchange==='function')window.onhashchange();setTimeout(a,0)};const q=document.getElementById('app');if(q)new MutationObserver(a).observe(q,{childList:true,subtree:true});a();document.addEventListener('click',e=>{if(e.target&&e.target.getAttribute('role')==='menuitemradio')setTimeout(r,0)});window.quizzesApplyShellLocale=a})()
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
(()=>{if(typeof document==="undefined")return;document.querySelectorAll=document.querySelectorAll||(()=>[]);const m={"All quizzes":"所有測驗","How it works":"運作方式","Support":"支援","Privacy":"私隱","Terms":"條款","PRIVATE SELF-DISCOVERY":"私人自我探索","What do you protect when no one is watching?":"當沒有人看見時，你會守護什麼？","A thoughtful, playful read on the instinct beneath your choices.":"以細膩而有趣的方式，探索你選擇背後的直覺。","Find your hidden pattern":"找出你的隱藏模式","12 questions · around 3 minutes":"12 條問題 · 約 3 分鐘","Choose this quiz →":"選擇此測驗 →","Private access by email. No sign-up required.":"以電郵取得私人連結。不需註冊。","ALL QUIZZES":"所有測驗","Find the question that follows you around.":"找出那個一直縈繞心頭的問題。","One quiet moment. One honest answer at a time.":"給自己一個安靜片刻，一次誠實回答一題。","View quiz →":"查看測驗 →","Coming soon":"即將推出","How do You Seek Recognition?":"你如何尋求認同？","Explore the instinct beneath validation, attention and vulnerability.":"探索認同、關注與脆弱感背後的直覺。","Private email access for 7 days":"私人電郵連結有效 7 天","private link. No sign-up required.":"付款。不需註冊。","All purchases are final — no refunds or exchanges after payment, except where required by law.":"所有購買均為最終交易；付款後不設退款或換貨，法律另有規定除外。","HOW IT WORKS":"運作方式","Simple by design.":"簡單而清晰。","Choose a quiz":"選擇測驗","Start with the question you are curious about.":"從你最想了解的問題開始。","Answer 5 free questions":"回答 5 條免費問題","Receive an early signal before deciding whether to continue.":"先取得初步提示，再決定是否繼續。","Unlock for HK$29":"以 HK$29 解鎖","Use secure checkout only when you want the full analysis.":"只在你想取得完整分析時，使用安全付款。","Continue privately":"私密地繼續","We email a personal link for your remaining questions.":"我們會以電郵寄出完成其餘問題的私人連結。","YOUR PRIVATE ACCESS":"你的私人連結","Where should we send your quiz link?":"你希望我們把測驗連結寄到哪裡？","After payment, we will email one secure link. It stays valid for 7 days.":"付款後，我們會以電郵寄出一條安全連結，有效期為 7 天。","Continue to secure payment →":"繼續安全付款 →","No sign-up. No mailing list. We use this only for purchase and access.":"不需註冊。不加入郵寄名單。我們只會將此電郵用於購買及存取。","PAYMENT STATUS PENDING":"付款狀態：處理中","We are verifying your payment.":"我們正在確認你的付款。","Your quiz link is emailed only after Stripe confirms payment. If you have paid, allow a moment for confirmation.":"Stripe 確認付款後，我們才會以電郵寄出測驗連結。如你已完成付款，請稍候片刻以待確認。","Nothing was charged.":"未有收取任何費用。","This link is no longer available.":"此連結已失效。","Your result":"你的結果","GO WITH YOUR FIRST INSTINCT":"跟隨你的第一直覺","YOUR PRIVATE REFLECTION":"你的私人反思","Evidence From Your Answers":"從你的回答得到的線索","Alternative Explanation & Confidence":"其他解釋與可信程度","What This Looks Like in Real Life":"在現實生活中的樣子","What to Watch / Try Next":"接下來可以留意或嘗試","What Red Flag Are You Most Likely to Explain Away?":"你最可能把哪種警號合理化？","Do You Want Love—or Proof That You Matter?":"你想要的是愛，還是證明自己重要？","Explore whether you want connection—or reassurance of your worth.":"探索你尋求的是連結，還是對自身價值的肯定。"};const run=()=>{if(document.documentElement.lang!=="zh-Hant")return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const a=[];while(w.nextNode())a.push(w.currentNode);a.forEach(n=>{const t=n.nodeValue.trim();if(m[t])n.nodeValue=n.nodeValue.replace(t,m[t])});document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(e=>["placeholder","aria-label","title"].forEach(k=>{const v=e.getAttribute(k);if(v&&m[v])e.setAttribute(k,m[v])}))};run();new MutationObserver(run).observe(document.body,{subtree:true,childList:true});})();/* Mobile Hant wording refinement */
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
})();/* Info Hant v2 */(()=>{const m={"PRIVATE BY DESIGN":"\私\隱\為\本","Privacy Notice":"\私\隱\聲\明","We use your email to send your purchase confirmation and private access link. Quiz answers and results are temporary; we do not create a permanent quiz-history account.":"\我\們\會\使\用\你\的\電\郵\寄\送\購\買\確\認\及\私\人\存\取\連\結\。\測\驗\回\答\及\結\果\只\會\暫\時\保\存\；\我\們\不\會\建\立\永\久\的\測\驗\紀\錄\帳\戶\。","Final purchases":"\購\買\一\經\完\成","All purchases are final, except where required by law.":"\除\法\律\規\定\外\，\所\有\購\買\均\為\最\終\交\易\。","CLEAR, NOT CLINICAL":"\清\晰\，\但\不\作\臨\床\用\途","Terms of Use":"\使\用\條\款","Quizzes it provides a digital self-reflection product for personal use. It is not medical, psychological, or diagnostic advice.":"Quizzes it \提\供\數\碼\自\我\反\思\產\品\，\供\個\人\使\用\。\這\並\非\醫\療\、\心\理\或\診\斷\建\議\。","Access and payment":"\存\取\與\付\款","Payment unlocks one private quiz link for seven days. Purchases are final except where required by law. For help with payment or access, contact hello@quizzes.it.com.":"\付\款\後\可\解\鎖\一\條\私\人\測\驗\連\結\，\有\效\期\為\七\天\。\除\法\律\規\定\外\，\購\買\一\經\完\成\恥\不\退\款\。\如\需\付\款\或\存\取\協\助\，\請\聯\絡 hello@quizzes.it.com\。","We are here if your link is not.":"\如\果\你\的\連\結\失\效\，\我\們\在\這\裡\幫\你\。","For a missing email, expired link, payment issue or privacy question, contact us and include the email used at checkout.":"\如\未\收\到\電\郵\、\連\結\已\過\期\、\付\款\遇\到\問\題\或\有\私\隱\疑\問\，\請\聯\絡\我\們\，\並\附\上\結\帳\時\使\用\的\電\郵\地\址\。","We usually reply within 1–2 business days.":"\我\們\通\常\會\在 1\–2 \個\工\作\天\內\回\覆\。","Missing link?":"\找\不\到\連\結\？","Check spam, then contact us from the purchase email address.":"\請\先\查\看\垃\圾\郵\件\，\再\使\用\購\買\時\的\電\郵\地\址\聯\絡\我\們\。","Link expired?":"\連\結\已\過\期\？","Contact support before purchasing again so we can help you understand your options.":"\再\次\購\買\前\請\先\聯\絡\支\援\，\我\們\會\協\助\你\了\解\可\行\選\項\。","Payment issue?":"\付\款\遇\到\問\題\？","Include your purchase email and approximate payment time.":"\請\附\上\購\買\電\郵\及\大\約\付\款\時\間\。"};const a=()=>{if(document.documentElement.lang!=="zh-Hant")return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),a=[];while(w.nextNode())a.push(w.currentNode);a.forEach(n=>{const t=n.nodeValue.trim();if(m[t])n.nodeValue=n.nodeValue.replace(t,m[t])})};if(typeof document!=="undefined"){eval("("+a+")")();void 0;if(typeof window.addEventListener==="function")window.addEventListener("hashchange",a);new MutationObserver(a).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]})}})();


/* legal-copy-hk-v2 */
(function(){if(typeof document==='undefined')return;
const c={en:{
privacy:{label:'CLEAR, NOT CLINICAL',title:'Privacy',intro:'Quizzes it is a digital self-reflection product for personal use. It is not medical, psychological, or diagnostic advice.',s:[
['What we collect','We collect information you choose to provide, such as an email address and quiz responses, together with the information needed to provide access and support.'],
['How we use it','We use this information to provide the digital product, respond to questions, maintain access, protect the service, and meet applicable legal obligations.'],
['Your choices','For questions, access requests, or privacy enquiries, contact hello@quizzes.it.com. We handle requests in line with applicable Hong Kong law.'],
['Cookies and browser storage','Essential browser storage may remember your language and quiz progress. You can manage cookies through your browser settings.'],
['Updates','If this Privacy page changes, the updated version will appear here.']
]},
terms:{label:'PLAIN, PERSONAL, DIGITAL',title:'Terms of Use',intro:'Quizzes it provides a digital self-reflection product for personal use. It is not medical, psychological, or diagnostic advice.',s:[
['General information','These Terms apply when you visit Quizzes it or use a quiz. By continuing, you agree to use the website lawfully and respectfully.'],
['Digital product and access','The product is delivered online. Access may be time-limited as shown at purchase. No physical goods are shipped.'],
['Payment and refunds','Payment unlocks the digital access described at checkout. If you are charged more than once or cannot access a purchased product, contact hello@quizzes.it.com so we can review the issue.'],
['Personal use','Quiz content is provided for your personal reflection. Do not copy, resell, redistribute, or present the content as your own.'],
['Intellectual property','The website, quiz content, results, design, and related materials belong to Quizzes it or its licensors and may not be reused without permission.'],
['No professional advice','The content is for reflection and general information. It does not diagnose, treat, or prevent any condition and should not replace professional advice.'],
['Liability','The product is provided for personal use and general information. We do not promise a particular outcome from taking a quiz.'],
['Changes and governing law','We may update these Terms by posting a revised version here. These Terms are governed by Hong Kong law.'],
['Contact','For questions about these Terms, access, or payment, contact hello@quizzes.it.com.']
]}},
'zh-Hant':{
privacy:{label:'清晰說明，非醫療建議',title:'私隱',intro:'Quizzes it 是供個人使用的數碼自我反思產品，並非醫療、心理或診斷建議。',s:[
['我們收集的資料','我們會收集你選擇提供的資料，例如電郵地址及答題內容，以及提供存取權和支援所需的資料。'],
['資料用途','我們使用這些資料提供數碼產品、回應查詢、維持存取權、保障服務，以及履行適用的法律責任。'],
['你的選擇','如有查詢、查閱資料要求或私隱問題，請聯絡 hello@quizzes.it.com。我們會按照適用的香港法律處理。'],
['Cookie 及瀏覽器儲存','必要的瀏覽器儲存功能可能會記住你的語言及測驗進度。你可以在瀏覽器設定中管理 Cookie。'],
['內容更新','如本私隱頁面有任何更改，我們會在此頁面刊登更新版本。']
]},
terms:{label:'簡單、個人、數碼產品',title:'使用條款',intro:'Quizzes it 提供供個人使用的數碼自我反思產品，並非醫療、心理或診斷建議。',s:[
['一般資料','本條款適用於你瀏覽 Quizzes it 或使用測驗的情況。繼續使用網站，即表示你同意合法及以尊重方式使用服務。'],
['數碼產品及存取權','產品以網上方式提供，存取期限以購買時顯示的內容為準，不會寄送實體貨品。'],
['付款及退款','付款後可取得結帳頁面所述的數碼存取權。如被重複收費或無法存取已購買產品，請聯絡 hello@quizzes.it.com，以便我們查核。'],
['個人使用','測驗內容只供你個人反思使用。未經許可，不得複製、轉售、重新發布或聲稱內容屬於你。'],
['知識產權','網站、測驗內容、結果、設計及相關資料屬於 Quizzes it 或其授權方，未經許可不得重用。'],
['並非專業建議','內容只作反思及一般資訊用途，不會為任何狀況作出診斷、治療或預防建議，亦不應取代專業意見。'],
['責任限制','產品供個人使用及一般資訊參考。我們不保證完成測驗會帶來特定結果。'],
['更改及適用法律','我們可透過在此刊登修訂版本更新本條款。本條款受香港法律管轄。'],
['聯絡我們','如對本條款、存取權或付款有疑問，請聯絡 hello@quizzes.it.com。']
]}}};
function apply(){if(typeof location==="undefined")return;const k=(location.hash||'').slice(1);if(k!=='privacy'&&k!=='terms')return;const m=document.querySelector('main');if(!m)return;const x=c[document.documentElement.lang==='zh-Hant'?'zh-Hant':'en'][k];m.innerHTML='<p class="eyebrow">'+x.label+'</p><h1>'+x.title+'</h1><p class="lead">'+x.intro+'</p>'+x.s.map(v=>'<section class="legalSection"><h2>'+v[0]+'</h2><p>'+v[1]+'</p></section>').join('')}
if(typeof window.addEventListener==='function')window.addEventListener('hashchange',apply);new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});apply()})();
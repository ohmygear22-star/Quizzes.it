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

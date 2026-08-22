
(() => {
  const app = document.getElementById("app");

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const money = (amount, currency) =>
    new Intl.NumberFormat("en-HK", {
      style: "currency",
      currency: String(currency || "hkd").toUpperCase()
    }).format(Number(amount || 0) / 100);

  async function getJson(path) {
    const response = await fetch(path, { headers: { Accept: "application/json" } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load quiz");
    return body;
  }

  function render(html) {
    app.innerHTML = '<section class="wrap">' + html + "</section>";
  }

  function go(route) {
    location.hash = route;
  }

  async function catalogue() {
    render('<section class="page"><p class="ey">ALL QUIZZES</p><h1>Find the question that follows you around.</h1><p class="lead">Loading available quizzes…</p></section>');

    try {
      const { quizzes } = await getJson("/api/quizzes");
      const rows = quizzes.map((quiz, index) => {
        const meta = quiz.metadata;
        return '<article class="row">' +
          '<small>' + String(index + 1).padStart(2, "0") + '</small>' +
          '<div><h2>' + escapeHtml(meta.title) + '</h2>' +
          '<p>' + escapeHtml(meta.description) + '</p>' +
          '<small>' + escapeHtml(meta.durationMinutes) + ' minutes · private access for ' + escapeHtml(meta.accessDays) + ' days</small></div>' +
          '<button class="primary" onclick="window.multiQuizGo(\'quiz/' + escapeHtml(quiz.slug) + '\')">View quiz →</button>' +
          '</article>';
      }).join("");

      render('<section class="page"><p class="ey">ALL QUIZZES</p><h1>Find the question that follows you around.</h1><p class="lead">One quiet moment. One honest answer at a time.</p><div class="list">' + rows + "</div></section>");
    } catch (error) {
      render('<section class="page"><h1>Quizzes are unavailable right now.</h1><p class="lead">' + escapeHtml(error.message) + "</p></section>");
    }
  }

  async function detail(slug) {
    render('<section class="page"><p class="ey">QUIZ</p><h1>Loading…</h1></section>');

    try {
      const quiz = await getJson("/api/quizzes/" + encodeURIComponent(slug));
      const meta = quiz.metadata;
      const offer = quiz.offers[0];
      document.title = quiz.seo?.title || meta.title + " | Quizzes it";

      render(
        '<section class="page">' +
        '<button class="back" onclick="window.multiQuizGo(\'catalog\')">← Back</button>' +
        '<p class="ey">' + escapeHtml(meta.category) + '</p>' +
        '<h1>' + escapeHtml(meta.title) + '</h1>' +
        '<p class="lead">' + escapeHtml(meta.description) + '</p>' +
        '<div class="facts"><span>' + escapeHtml(meta.durationMinutes) + ' minutes</span><span>Private access for ' + escapeHtml(meta.accessDays) + ' days</span><span>' + money(offer.amount, offer.currency) + '</span></div>' +
        '<button class="primary" onclick="location.hash=\'email\'">Choose this quiz →</button>' +
        '<p class="micro">One-time payment. No sign-up required.</p>' +
        '</section>'
      );
    } catch (error) {
      render('<section class="page"><h1>Quiz not found.</h1><button class="primary" onclick="window.multiQuizGo(\'catalog\')">View all quizzes →</button></section>');
    }
  }

  function route() {
    const path = location.pathname;
    const hash = location.hash.slice(1);

    if (path.startsWith("/quiz/")) return detail(path.split("/").pop());
    if (hash === "catalog") return catalogue();
    if (hash.startsWith("quiz/")) return detail(hash.slice(5));
  }

  window.multiQuizGo = go;
  addEventListener("hashchange", route);
  route();
})();

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, EnvelopeClosedIcon, LockClosedIcon, StarIcon } from "@radix-ui/react-icons";

type View = "home" | "catalog" | "detail" | "how" | "email" | "checkout" | "access" | "quiz" | "result" | "privacy" | "terms" | "support";
type Quiz = { id: string; name: string; description: string; length: string; availability: "available" | "soon" };

const quizzes: Quiz[] = [
  { id: "hidden-pattern", name: "How narcissistic are you?", description: "A playful look at how you relate to attention, validation and vulnerability.", length: "10 questions · around 2 minutes", availability: "available" },
  { id: "social-battery", name: "What is your social battery?", description: "Explore the conditions that refill—or drain—your social energy.", length: "12 questions · around 3 minutes", availability: "soon" },
  { id: "love-language", name: "How do you show up in love?", description: "A reflective quiz about connection, closeness and communication.", length: "12 questions · around 3 minutes", availability: "soon" },
  { id: "chaos-style", name: "What kind of chaos are you?", description: "A light-hearted read on how you react when life gets unpredictable.", length: "10 questions · around 2 minutes", availability: "soon" },
];

const questions = [
  ["When you receive criticism, your first instinct is to…", "Find the useful part", "Explain your side", "Pull away", "Dismiss it"],
  ["In a group, you most want to be seen as…", "Dependable", "Exceptional", "Independent", "Easy to be around"],
  ["When plans change without you, you tend to…", "Adapt quickly", "Ask what happened", "Feel quietly unsettled", "Make a better plan"],
  ["What feels most uncomfortable?", "Being overlooked", "Being misunderstood", "Needing help", "Letting someone down"],
  ["When someone else succeeds, you usually…", "Feel genuinely happy", "Notice what made it work", "Compare yourself", "Want to do more"],
];

function Arrow() { return <ArrowRightIcon aria-hidden="true" />; }
function Back({ onClick }: { onClick: () => void }) { return <button className="back" onClick={onClick}><ArrowLeftIcon /> Back</button>; }

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>(quizzes[0]);
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [notice, setNotice] = useState("");
  const [catalogNotice, setCatalogNotice] = useState("");
  const progress = useMemo(() => `${((current + 1) / questions.length) * 100}%`, [current]);

  function openQuiz(quiz: Quiz) { setSelectedQuiz(quiz); setView(quiz.availability === "available" ? "detail" : "catalog"); if (quiz.availability === "soon") setCatalogNotice(`${quiz.name} is coming soon.`); }
  function startPurchase() { setView("email"); }
  function submitEmail(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (email.trim()) setView("checkout"); }
  function selectAnswer(answer: string) { const next = [...answers]; next[current] = answer; setAnswers(next); }
  function nextQuestion() { if (!answers[current]) return; if (current === questions.length - 1) { setView("result"); return; } setCurrent((value) => value + 1); }
  function retake() { setAnswers([]); setCurrent(0); setView("quiz"); }

  const navigate = (target: View) => () => { setCatalogNotice(""); setNotice(""); setView(target); };

  return <main className="site-shell">
    <header className="site-header">
      <button className="brand" onClick={navigate("home")}>QUIZZES IT</button>
      <nav className="site-nav" aria-label="Main navigation"><button onClick={navigate("catalog")}>All quizzes</button><button onClick={navigate("how")}>How it works</button><button onClick={navigate("support")}>Support</button></nav>
      <button className="language" type="button" onClick={() => setNotice("English is the only launch language.")}>EN</button>
    </header>

    {view === "home" && <section className="hero page-wrap">
      <img className="hero-ink" src="/ink-hero.png" alt="Flowing dark maroon ink" />
      <div className="hero-content">
        <p className="eyebrow">PRIVATE SELF-DISCOVERY</p><h1>What do you protect when no one is watching?</h1>
        <p className="lead">A thoughtful, playful read on the instinct beneath your choices.</p>
        <section className="quiz-intro"><div className="intro-mark" aria-hidden="true"><StarIcon /></div><div><strong>Find your hidden pattern</strong><span>10 questions · around 2 minutes</span></div></section>
        <div className="hero-actions"><button className="primary" onClick={() => openQuiz(quizzes[0])}>Choose this quiz <Arrow /></button><p className="micro"><LockClosedIcon /> Private access by email. No sign-up required.</p><button className="secondary" type="button" onClick={navigate("catalog")}>Discover more about yourself <Arrow /></button></div>
      </div>
    </section>}

    {view === "catalog" && <section className="catalog-page page-wrap"><p className="eyebrow">ALL QUIZZES</p><h1>Find the question that follows you around.</h1><p className="lead">One quiet moment. One honest answer at a time.</p><div className="quiz-list">{quizzes.map((quiz, index) => <article className="quiz-row" key={quiz.id}><span className="quiz-number">0{index + 1}</span><div><h2>{quiz.name}</h2><p>{quiz.description}</p><small>{quiz.length}</small></div>{quiz.availability === "available" ? <button className="row-action" onClick={() => openQuiz(quiz)}>View quiz <Arrow /></button> : <button className="row-action muted" onClick={() => openQuiz(quiz)}>Coming soon</button>}</article>)}</div>{catalogNotice && <p className="catalog-note" role="status">{catalogNotice}</p>}</section>}

    {view === "detail" && <section className="detail-page page-wrap"><Back onClick={navigate("catalog")} /><p className="eyebrow">FIRST QUIZ</p><h1>{selectedQuiz.name}</h1><p className="lead">{selectedQuiz.description}</p><div className="detail-facts"><span>{selectedQuiz.length}</span><span>Private email access for 7 days</span><span>US$3.99</span></div><button className="primary" onClick={startPurchase}>Choose this quiz <Arrow /></button><p className="micro"><LockClosedIcon /> One-time payment. No sign-up required.</p><p className="purchase-rule">All purchases are final — no refunds or exchanges after payment, except where required by law.</p><p className="disclaimer">For entertainment and self-reflection only. This quiz is not a medical, psychological or mental-health assessment and does not diagnose any condition.</p></section>}

    {view === "how" && <section className="info-page page-wrap"><p className="eyebrow">HOW IT WORKS</p><h1>Simple by design.</h1><div className="steps"><article><b>01</b><h2>Choose a quiz</h2><p>Pick the question you are curious about.</p></article><article><b>02</b><h2>Pay once</h2><p>Review the price and complete secure checkout.</p></article><article><b>03</b><h2>Receive your link</h2><p>We email a personal access link that is valid for 7 days.</p></article><article><b>04</b><h2>See your result</h2><p>Answer at your own pace and see the result immediately.</p></article></div><button className="primary" onClick={navigate("catalog")}>Explore all quizzes <Arrow /></button></section>}

    {view === "email" && <section className="narrow-page page-wrap"><Back onClick={() => setView("detail")} /><p className="eyebrow">YOUR PRIVATE ACCESS</p><h1>Where should we send your quiz link?</h1><p className="lead">After payment, we will email one secure link. It stays valid for 7 days.</p><form className="email-form" onSubmit={submitEmail}><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /><button className="primary" type="submit">Continue to secure payment <Arrow /></button></form><p className="micro">No sign-up required. No mailing list. We use this only for your purchase and access link.</p><button className="inline-link" onClick={navigate("privacy")}>Read our Privacy Notice</button></section>}

    {view === "checkout" && <section className="narrow-page page-wrap"><Back onClick={() => setView("email")} /><p className="eyebrow">ONE-TIME PAYMENT</p><h1>Your private result is waiting.</h1><div className="order-summary"><span>{selectedQuiz.name}</span><strong>US$3.99</strong><small>One detailed result · secure email access for 7 days</small></div><p className="purchase-rule">All purchases are final — no refunds or exchanges after payment, except where required by law.</p><button className="primary" onClick={() => setNotice("Stripe is not connected yet. This button will open the real secure checkout once your Stripe setup is complete.")}>Pay securely <Arrow /></button>{notice && <p className="setup-note" role="status">{notice}</p>}<button className="text-link" onClick={() => setView("access")}>Preview the post-payment access screen</button><p className="checkout-links"><button onClick={navigate("terms")}>Terms of Use</button></p></section>}

    {view === "access" && <section className="narrow-page page-wrap"><p className="eyebrow">PAYMENT CONFIRMED</p><h1>Your private quiz link has been sent.</h1><p className="lead">We sent it to <strong>{email || "your email address"}</strong>. Open that email on any device to begin. Your link expires in 7 days.</p><button className="primary" onClick={() => setView("quiz")}>Preview secure quiz access <Arrow /></button><p className="micro">This preview button will not appear on the live payment confirmation page; customers begin through their email link.</p></section>}

    {view === "quiz" && <section className="quiz-page page-wrap"><div className="quiz-top"><button className="back" onClick={navigate("home")}><ArrowLeftIcon /> Exit</button><span>{current + 1} / {questions.length}</span></div><div className="progress"><i style={{ width: progress }} /></div><p className="eyebrow">GO WITH YOUR FIRST INSTINCT</p><h1>{questions[current][0]}</h1><div className="answer-list">{questions[current].slice(1).map((answer) => <button key={answer} className={answers[current] === answer ? "answer selected" : "answer"} onClick={() => selectAnswer(answer)}>{answer}<Arrow /></button>)}</div><button className="primary continue" disabled={!answers[current]} onClick={nextQuestion}>{current === questions.length - 1 ? "See my result" : "Continue"} <Arrow /></button><p className="micro">Private access · temporary quiz answers and results are removed after expiry.</p></section>}

    {view === "result" && <section className="result-page page-wrap"><p className="eyebrow">YOUR RESULT</p><h1>You protect your inner world.</h1><p className="lead">You tend to observe before you reveal yourself. This can make you steady and discerning; it can also make closeness feel like a risk.</p><div className="reflection"><b>Try this reflection</b><p>What would change if you assumed that being seen did not mean losing control?</p></div><button className="primary" onClick={retake}>Retake this quiz <Arrow /></button><p className="micro">Retakes are included while your secure link remains active.</p></section>}

    {view === "privacy" && <LegalPage title="Privacy Notice" kicker="YOUR DATA, EXPLAINED"><p>We collect your email address to send purchase confirmation and your secure access link. We also process a payment reference from our payment provider and temporary quiz answers/results so we can provide the quiz service.</p><h2>How we use and retain data</h2><p>We use personal data only to provide the purchased quiz, prevent misuse, handle support, and meet legal obligations. Temporary quiz answers and results are deleted after the seven-day access period. We do not create a permanent quiz-history account. We do not use your email for marketing unless you separately choose to opt in.</p><h2>Who may process it</h2><p>Our payment, email-delivery, hosting and security providers may process the minimum data needed to operate their service. They do not receive your card details from us.</p><h2>Your choices</h2><p>You may ask about access to or correction of your personal data, or raise a privacy concern, by emailing hello@quizzes.it.com. Before submitting an email, you can read this notice to understand why it is collected.</p><p className="disclaimer">This is launch-stage draft privacy copy. The final policy should name the operating entity, hosting location and providers before public launch.</p></LegalPage>}

    {view === "terms" && <LegalPage title="Terms of Use" kicker="CLEAR, NOT CLINICAL"><p>Quizzes it provides paid digital self-reflection and entertainment quizzes. Quiz descriptions, price and access period are shown before checkout. A completed payment gives one person a personal, email-bound quiz link for the stated access period.</p><h2>Final purchases</h2><p>All purchases are final. No refunds or exchanges are offered after payment, except where required by law.</p><h2>Not a diagnosis or advice</h2><p>Our quizzes are not medical, psychological, psychiatric or mental-health assessments. They do not diagnose ADHD, narcissistic personality disorder, or any other condition. They are not professional advice, treatment or an emergency service. If you are worried about your wellbeing, please contact a qualified professional or local emergency service.</p><h2>Fair use and age</h2><p>Do not share, sell, copy or attempt to bypass your personal access link. Users aged 13 to 17 should obtain a parent or guardian’s permission before making a purchase.</p><h2>Changes and support</h2><p>If we make a material change to these terms, it will apply only as permitted by law. Contact support if you have an access or technical problem.</p></LegalPage>}

    {view === "support" && <section className="support-page page-wrap"><p className="eyebrow">SUPPORT</p><h1>We are here if your link is not.</h1><p className="lead">For a missing email, expired link, payment issue or privacy question, contact us and include the email address you used at checkout.</p><a className="support-email" href="mailto:hello@quizzes.it.com"><EnvelopeClosedIcon /> hello@quizzes.it.com</a><div className="support-list"><article><h2>Missing link?</h2><p>Check spam/junk, then contact us from the purchase email address.</p></article><article><h2>Link expired?</h2><p>Access links are valid for seven days after payment. We cannot promise access after expiry.</p></article><article><h2>Payment issue?</h2><p>Include the purchase email address and approximate payment time so we can investigate.</p></article></div></section>}

    {notice && view === "home" && <p className="global-notice" role="status">{notice}</p>}
    <footer><span>© Quizzes it</span><button onClick={navigate("privacy")}>Privacy</button><button onClick={navigate("terms")}>Terms</button><button onClick={navigate("support")}>Support</button></footer>
  </main>;
}

function LegalPage({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return <section className="legal-page page-wrap"><p className="eyebrow">{kicker}</p><h1>{title}</h1><div className="legal-copy">{children}</div></section>;
}

import { ArrowRightIcon, ChevronLeftIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { MobileScroll, useKeyboard } from "./mobile";

type Screen = "landing" | "quiz" | "result";
const questions = ["When someone questions your decision, what happens first?", "When a plan suddenly changes, what do you protect most?", "What does your closest friend rely on you for?"];
const choices = ["I explain my thinking", "I push back", "I go quiet", "I change the subject"];

export default function Prototype() {
  const keyboard = useKeyboard();
  const [screen, setScreen] = useState<Screen>("landing");
  const [question, setQuestion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [offer, setOffer] = useState<"report" | "pack">("pack");
  const moveForward = () => {
    if (!selected) return;
    if (question < questions.length - 1) { setQuestion((value) => value + 1); setSelected(null); return; }
    keyboard.hide();
    setScreen("result");
  };

  if (screen === "landing") return <MobileScroll className="app-screen"><style>{`.landing-art img{object-position:center center!important;opacity:.94!important;mix-blend-mode:normal!important}.quiz-art{opacity:.72!important;mix-blend-mode:normal!important}`}</style><main className="landing-screen">
    <header className="topline"><span>SHADOW SELF</span><button className="language" type="button">EN</button></header>
    <section className="landing-hero"><p className="eyebrow">A PRIVATE SELF-DISCOVERY QUIZ</p><h1>What do you protect when no one is watching?</h1><p className="landing-copy">A thoughtful, playful read on the instinct beneath your choices.</p></section>
    <section className="landing-art" aria-label="Abstract ink artwork"><img src="/shadow-ink-art.png" alt="Abstract dark ink bloom" /></section>
    <section className="start-panel"><div><strong>Find your hidden pattern</strong><span>10 questions · about 2 minutes</span></div><button className="primary-button" type="button" onClick={() => setScreen("quiz")}>Start free <ArrowRightIcon /></button><p><LockClosedIcon /> Private by default. No account needed to start.</p></section>
  </main></MobileScroll>;

  if (screen === "result") {
    const price = offer === "pack" ? "$14.99" : "$3.99";
    return <MobileScroll className="app-screen"><main className="result-screen">
      <button className="back-button" type="button" onClick={() => setScreen("quiz")} aria-label="Back to quiz"><ChevronLeftIcon /></button><p className="eyebrow">YOUR FIRST RESULT</p><h1>You protect your inner world.</h1><div className="result-art"><img src="/shadow-ink-art.png" alt="Abstract ink bloom" /></div><p className="result-copy">You pause before revealing yourself. Your full result explains what strengthens this instinct—and when it can hold you back.</p>
      <section className="unlock-section"><p className="unlock-title">Unlock the full pattern</p><button className={`offer ${offer === "report" ? "selected-offer" : ""}`} type="button" onClick={() => setOffer("report")}><span><strong>One detailed report</strong><small>Your full result + reflection prompts</small></span><b>$3.99</b></button><button className={`offer ${offer === "pack" ? "selected-offer" : ""}`} type="button" onClick={() => setOffer("pack")}><span><em>BEST VALUE</em><strong>The Shadow Self Pack</strong><small>6 quizzes + every detailed result</small></span><b>$14.99</b></button></section>
      <button className="primary-button unlock-button" type="button" onClick={() => alert(`${price} checkout would open here.`)}>Unlock for {price} <ArrowRightIcon /></button><p className="secure"><LockClosedIcon /> Secure checkout · One-time payment</p>
    </main></MobileScroll>;
  }

  return <MobileScroll className="app-screen"><main className="quiz-screen">
    <header className="quiz-header"><button className="back-button" type="button" onClick={() => setScreen("landing")} aria-label="Back"><ChevronLeftIcon /></button><span>SHADOW SELF</span><span className="step">{question + 1} of {questions.length}</span></header><div className="progress-track"><span style={{ width: `${((question + 1) / questions.length) * 100}%` }} /></div>
    <section className="question-area"><p className="eyebrow">GO WITH YOUR FIRST INSTINCT</p><h1>{questions[question]}</h1><img className="quiz-art" src="/shadow-ink-art.png" alt="Abstract ink bloom" /></section>
    <section className="answers" aria-label="Answer choices">{choices.map((choice) => <button key={choice} type="button" className={selected === choice ? "answer selected-answer" : "answer"} onClick={() => setSelected(choice)}><span>{choice}</span><ArrowRightIcon /></button>)}</section>
    <footer className="quiz-footer"><p><LockClosedIcon /> Private. Takes 2 minutes.</p><button className="primary-button" type="button" disabled={!selected} onClick={moveForward}>{question === questions.length - 1 ? "See my result" : "Continue"}<ArrowRightIcon /></button></footer>
  </main></MobileScroll>;
}

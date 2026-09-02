import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src=fs.readFileSync(new URL("../public/multi-quiz.js",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
const between=(text,start,end)=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));
const core=src.slice(0,src.indexOf("window.multiQuizGo = go;"));

test("production landing uses the approved broad positioning and start action",()=>{
  const landing=between(core,"function landing()","function publicCopy");
  assert.match(landing,/PERSONAL REFLECTION QUIZZES/);
  assert.match(landing,/Start with five-question preview/);
  assert.match(landing,/Start the quiz/);
  assert.ok(landing.includes("HK$29"));
  assert.doesNotMatch(landing,/PRIVATE SELF-DISCOVERY|free five-question|Start free preview/);
});

test("production shell exposes separate language controls and a full-width mobile menu",()=>{
  assert.match(html,/class="languageSwitch"/);
  assert.match(html,/class="menuBtn"/);
  assert.match(html,/id="mobileMenu"/);
  assert.match(html,/Privacy/);
  assert.match(html,/Terms/);
  assert.ok(html.includes("@media(max-width:760px)"));
  assert.match(html,/width:100%/);
});

test("catalogue renders ten quizzes per page with accessible numbered pagination",()=>{
  const catalogue=between(core,"async function catalogue()","async function detail");
  assert.ok(src.includes("CATALOG_PAGE_SIZE = 10"));
  assert.match(catalogue,/catalogPagination/);
  assert.match(catalogue,/aria-current/);
  assert.match(catalogue,/setCatalogPage/);
});

test("quiz detail keeps the approved back action and removes free-preview promotion",()=>{
  const detail=between(core,"async function detail","async function preview");
  assert.match(detail,/Back to all quizzes/);
  assert.match(detail,/Start the quiz/);
  assert.doesNotMatch(detail,/Your early insight is free|Start free preview|meta.previewLabel/);
});

test("result rendering preserves the eight-phase fallback and adds the approved deterministic personality UI",()=>{
  const result=between(src,"function fullResult","function route");
  assert.match(result,/Array\.isArray\(result\.phases\)/);
  assert.match(result,/truthPacket/);
  assert.match(result,/personalities/);
  assert.match(result,/legacy-result-note/);
  assert.doesNotMatch(result,/customerPerspective|analyticalPerspective/);
});

test("mobile layout hides desktop navigation and keeps the full-width menu aligned",()=>{assert.match(html,/\.desktopNav\{display:none!important\}/);assert.match(html,/#mobileMenu\.menu\{left:0!important;right:0!important;width:100vw!important/);});

test("production shell resets native desktop buttons and spaces home metadata",()=>{assert.match(html,/\.desktopNav button\{border:0;background:transparent/);assert.match(html,/\.homeMeta\{display:flex/);});

test("informational pages use open editorial rows without boxed cards",()=>{
  assert.match(html,/how-open-rows/);
  assert.match(html,/support-open-rows/);
  assert.match(html,/.how-open-rows \.step/);
  assert.match(html,/.support-open-rows \.supportItem/);
  assert.doesNotMatch(html,/.page \.cards\{grid-template-columns:repeat\(2/);
});


test("catalogue mobile overrides desktop card grid",()=>{assert.match(html,/catalogPage \.card\{grid-template-columns:44px/);assert.match(html,/@media\(max-width:760px\)[^}]*catalogPage \.card/);});


test("catalogue mobile compact marker",()=>{assert.match(html,/catalog-mobile-compact/);});


test("zh-Hant homepage typography variant exists",()=>{assert.match(html,/zh-hant-home-typography/);assert.match(html,/html\[lang=\"zh-Hant\"\] #app \.content h1/);});


test("payment metadata omits one-time copy",()=>{assert.doesNotMatch(html,/one-time/);assert.doesNotMatch(html,/\u4e00\u6b21\u6027/);});


test("runtime payment copy omits one-time",()=>{const multi=fs.readFileSync("public/multi-quiz.js","utf8");assert.doesNotMatch(multi,/one-time payment/);assert.doesNotMatch(multi,/\u4e00\u6b21\u6027/);});


test("question-count copy removed",()=>{const all=html+"\n"+fs.readFileSync("public/multi-quiz.js","utf8");assert.doesNotMatch(all,/5 questions/);assert.doesNotMatch(all,/\u4e94 \u689d \u984c\u76ee/);assert.doesNotMatch(all,/remaining questions and result/);assert.doesNotMatch(all,/\u53ca\u67e5\u770b\u7d50\u679c\u7684\u79c1\u4eba\u9023\u7d50/);});

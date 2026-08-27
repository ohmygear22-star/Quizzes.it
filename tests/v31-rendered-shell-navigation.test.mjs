import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('/opt/quizzes/app/public/multi-quiz.js', 'utf8');
const shell = source.slice(source.indexOf('/* QUIZES_SHELL_LOCALE_PATCH_V2 */'));
const english = ['All quizzes', 'How it works', 'Support', 'Privacy', 'Terms', 'Start free preview →', 'PRIVATE SELF-DISCOVERY', 'What do you protect when no one is watching?', 'ALL QUIZZES', '← Back', 'EARLY SIGNAL — NOT YOUR FINAL RESULT', 'There is more to see in your pattern.', 'Unlock my full analysis — HK$29.00 →', 'Private link by email · available for 7 days.'];
const hant = ['所有測驗', '測驗如何運作', '支援', '私隱', '條款', '開始免費預覽 →', '私人自我探索', '沒有人看見時，你在保護甚麼？', '所有測驗', '← 返回', '初步訊號 — 並非你的最終結果', '你的模式還有更多值得了解。', '解鎖我的完整分析 — HK$29.00 →', '私人連結將透過電郵寄出 · 有效期 7 天。'];

function render(initialLocale) {
  let locale = initialLocale;
  let click;
  const nodes = english.map(nodeValue => ({ nodeValue }));
  const document = {
    body: {}, documentElement: {}, getElementById: () => ({}),
    createTreeWalker() { let index = -1; return { currentNode: null, nextNode() { this.currentNode = nodes[++index]; return index < nodes.length; } }; },
    addEventListener(type, fn) { if (type === 'click') click = fn; }
  };
  class MutationObserver { constructor() {} observe() {} }
  vm.runInNewContext(shell, { document, NodeFilter: { SHOW_TEXT: 4 }, MutationObserver, localStorage: { getItem: () => locale }, window: { onhashchange() {} }, setTimeout: fn => fn() });
  return { lang: () => document.documentElement.lang, text: () => nodes.map(n => n.nodeValue), switchTo(next) { locale = next; click({ target: { getAttribute: () => 'menuitemradio' } }); } };
}

test('rendered shell follows EN to Hant to reload to EN across desktop and mobile navigation', () => {
  const page = render('en');
  assert.equal(page.lang(), 'en');
  assert.deepEqual(page.text(), english);
  page.switchTo('zh-Hant');
  assert.equal(page.lang(), 'zh-Hant');
  assert.deepEqual(page.text(), hant);
  const reload = render('zh-Hant');
  assert.deepEqual(reload.text(), hant);
  reload.switchTo('en');
  assert.equal(reload.lang(), 'en');
  assert.deepEqual(reload.text(), english);
  assert.deepEqual(hant.slice(0, 3), ['所有測驗', '測驗如何運作', '支援']);
});

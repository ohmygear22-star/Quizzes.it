import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../public/multi-quiz.js',import.meta.url),'utf8');
test('shell locale patch includes EN and Traditional Chinese visible copy',()=>{assert.match(source,/QUIZES_SHELL_LOCALE_PATCH_V2/);assert.match(source,/沒有人看見時，你在保護甚麼/);assert.match(source,/開始免費預覽/);assert.match(source,/所有測驗/);});
test('shell locale patch keeps only supported locales',()=>{assert.doesNotMatch(source,/zh-CN|zh-Hans|Simplified|簡體/);assert.match(source,/localStorage\.getItem\('quizzes\.locale'\)/);});
test('locale changes trigger active route rerender',()=>{assert.match(source,/window\.onhashchange\(\)/);assert.match(source,/menuitemradio/);});
test('shell patch translates rendered text nodes after mutations',()=>{assert.match(source,/createTreeWalker/);assert.match(source,/MutationObserver/);});

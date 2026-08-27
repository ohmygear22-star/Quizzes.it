import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('/opt/quizzes/app/public/multi-quiz.js', 'utf8');

test('Traditional Chinese journey includes a complete locale repair map', () => {
  assert.ok(source.includes('UX_LOCALE_REPAIR_V1'));
  for (const copy of [
    'FREE PREVIEW',
    'Preview progress',
    'Go with your first instinct.',
    'Continue from where you left off.',
    'PAYMENT STATUS',
    'We are verifying your payment.',
    'YOUR PRIVATE REFLECTION',
    "We're With You",
    'The Deeper Pattern',
    'Questions that shaped your reflection',
    'Retake this quiz'
  ]) assert.ok(source.includes(copy), `missing source key: ${copy}`);
});

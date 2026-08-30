import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseReport, buildGalleryHtml } from './generate-gallery.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleXml = readFileSync(
  path.join(__dirname, 'fixtures', 'sample-report.xml'),
  'utf8'
);

test('parseReport extracts one row per testcase with pass/fail status', () => {
  const cases = parseReport(sampleXml);

  assert.equal(cases.length, 3);
  assert.deepEqual(
    cases.map((c) => c.name),
    ['valid-login', 'locked-account', 'checkout-happy-path']
  );
  assert.equal(cases[0].passed, true);
  assert.equal(cases[1].passed, true);
  assert.equal(cases[2].passed, false);
  assert.match(cases[2].failureMessage, /Thank you for your order/);
});

test('buildGalleryHtml embeds a video src for a matching file', () => {
  const cases = parseReport(sampleXml);
  const html = buildGalleryHtml(cases, ['valid-login.mp4', 'checkout-happy-path.mp4']);

  assert.match(html, /<video[^>]*src="videos\/valid-login\.mp4"/);
  assert.match(html, /<video[^>]*src="videos\/checkout-happy-path\.mp4"/);
});

test('buildGalleryHtml marks a testcase with no matching video as unavailable', () => {
  const cases = parseReport(sampleXml);
  const html = buildGalleryHtml(cases, ['valid-login.mp4']);

  assert.match(html, /locked-account[\s\S]*no video available/);
});

test('buildGalleryHtml marks failed testcases distinctly from passed ones', () => {
  const cases = parseReport(sampleXml);
  const html = buildGalleryHtml(cases, []);

  assert.match(html, /class="status-pass"[^>]*>PASS/);
  assert.match(html, /class="status-fail"[^>]*>FAIL/);
});

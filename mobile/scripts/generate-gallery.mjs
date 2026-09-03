import { XMLParser } from 'fast-xml-parser';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

export function parseReport(xmlString) {
  const parsed = parser.parse(xmlString);
  const suites = [].concat(parsed.testsuites?.testsuite ?? []);

  return suites.flatMap((suite) => {
    const cases = [].concat(suite.testcase ?? []);
    return cases.map((tc) => {
      const failure = tc.failure;
      return {
        name: tc.name,
        classname: tc.classname,
        time: Number(tc.time ?? 0),
        passed: failure === undefined,
        failureMessage: failure ? (typeof failure === 'string' ? failure : failure['#text']) : null,
      };
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

export function buildGalleryHtml(testcases, videoFilenames) {
  const videoSet = new Set(videoFilenames);

  const rows = testcases
    .map((tc) => {
      const videoFile = `${tc.name}.mp4`;
      const hasVideo = videoSet.has(videoFile);
      const statusClass = tc.passed ? 'status-pass' : 'status-fail';
      const statusLabel = tc.passed ? 'PASS' : 'FAIL';
      const media = hasVideo
        ? `<video controls src="videos/${escapeHtml(videoFile)}"></video>`
        : '<p class="no-video">no video available</p>';
      const failure = tc.failureMessage
        ? `<pre class="failure">${escapeHtml(tc.failureMessage)}</pre>`
        : '';
      const label =
        tc.classname && tc.classname !== tc.name
          ? `${escapeHtml(tc.classname)}/${escapeHtml(tc.name)}`
          : escapeHtml(tc.name);

      return `
        <tr>
          <td>${label}</td>
          <td class="${statusClass}">${statusLabel}</td>
          <td>${tc.time.toFixed(2)}s</td>
          <td>${media}${failure}</td>
        </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Mobile — Maestro evidence</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 0.5rem; vertical-align: top; text-align: left; }
    video { max-width: 320px; }
    .status-pass { color: #16794c; font-weight: bold; }
    .status-fail { color: #b3261e; font-weight: bold; }
    .no-video { color: #666; font-style: italic; }
    .failure { white-space: pre-wrap; color: #b3261e; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Mobile — Maestro evidence</h1>
  <table>
    <thead>
      <tr><th>Flow</th><th>Status</th><th>Duration</th><th>Evidence</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
`;
}

function main() {
  const [reportPath = 'artifacts/report.xml', videosDir = 'artifacts/videos', outDir = 'artifacts/gallery'] =
    process.argv.slice(2);

  const xml = readFileSync(reportPath, 'utf8');
  const testcases = parseReport(xml);

  let videoFiles = [];
  try {
    videoFiles = readdirSync(videosDir).filter((f) => f.endsWith('.mp4'));
  } catch {
    videoFiles = [];
  }

  const html = buildGalleryHtml(testcases, videoFiles);

  mkdirSync(path.join(outDir, 'videos'), { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), html);
  for (const file of videoFiles) {
    copyFileSync(path.join(videosDir, file), path.join(outDir, 'videos', file));
  }

  console.log(`Gallery written to ${path.join(outDir, 'index.html')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

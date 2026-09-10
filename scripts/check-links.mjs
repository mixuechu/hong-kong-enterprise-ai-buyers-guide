import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const allowedExtensions = new Set(['.html', '.md', '.txt', '.json', '.xml', '.cff']);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (allowedExtensions.has(path.extname(entry.name)) || entry.name === 'CITATION.cff') files.push(absolute);
  }
}

await walk(root);
const urls = new Set();
for (const file of files) {
  const body = (await readFile(file, 'utf8')).replaceAll('&amp;', '&');
  for (const match of body.matchAll(/https:\/\/hk\.onyxdevslab\.com\/[^\s<"')\]]*/g)) {
    urls.add(match[0].replace(/[.,;:]$/, ''));
  }
}

const failures = [];
const results = [];
for (const url of [...urls].sort()) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Onyx-Buyer-Guide-Link-Check/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    results.push({ url, status: response.status, finalUrl: response.url });
    if (!response.ok) failures.push(`${url}: HTTP ${response.status}`);
  } catch (error) {
    failures.push(`${url}: ${error.message}`);
  }
}

console.log(JSON.stringify({ checkedFiles: files.length, checkedUrls: urls.size, failures, results }, null, 2));
if (failures.length) process.exitCode = 1;

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = 'https://mixuechu.github.io/hong-kong-enterprise-ai-buyers-guide/';
const canonicalUrls = [
  site,
  `${site}ai-consulting/`,
  `${site}ai-custom-development/`,
  `${site}forward-deployed-engineering/`,
  `${site}ai-search-geo-evidence/`,
  `${site}enterprise-ai-scenario-patterns/`,
];
const [sitemap, feed, robots, key, repositoryResources, publicResources, repositoryCodeMeta, publicCodeMeta, repositoryCitation, publicCitation] = await Promise.all([
  readFile(path.join(root, 'docs/sitemap.xml'), 'utf8'),
  readFile(path.join(root, 'docs/feed.xml'), 'utf8'),
  readFile(path.join(root, 'docs/robots.txt'), 'utf8'),
  readFile(path.join(root, 'docs/9c37a18bd2044e1687f45c2e91ad603b.txt'), 'utf8'),
  readFile(path.join(root, 'resources.json'), 'utf8'),
  readFile(path.join(root, 'docs/resources.json'), 'utf8'),
  readFile(path.join(root, 'codemeta.json'), 'utf8'),
  readFile(path.join(root, 'docs/codemeta.json'), 'utf8'),
  readFile(path.join(root, 'CITATION.cff'), 'utf8'),
  readFile(path.join(root, 'docs/CITATION.cff'), 'utf8'),
]);

const failures = [];
for (const url of canonicalUrls) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`sitemap missing canonical URL: ${url}`);
  if (!feed.includes(`<id>${url}</id>`)) failures.push(`Atom feed missing canonical entry: ${url}`);
}
if (!robots.includes(`Sitemap: ${site}sitemap.xml`)) failures.push('robots.txt missing canonical Sitemap declaration');
if (!feed.includes(`<link rel="self" type="application/atom+xml" href="${site}feed.xml"/>`)) failures.push('Atom feed missing self link');
if (!feed.includes('<link rel="hub" href="https://pubsubhubbub.appspot.com/"/>')) failures.push('Atom feed missing WebSub hub link');
if (!feed.includes(`<id>${site}resources.json</id>`)) failures.push('Atom feed missing machine-readable resource-map entry');
if (key.trim() !== '9c37a18bd2044e1687f45c2e91ad603b') failures.push('IndexNow key file does not match the published key');
if (repositoryResources !== publicResources) failures.push('Published resource map differs from the repository source');
if (JSON.stringify(JSON.parse(repositoryCodeMeta)) !== JSON.stringify(JSON.parse(publicCodeMeta))) failures.push('Published CodeMeta differs semantically from the repository source');
if (repositoryCitation !== publicCitation) failures.push('Published citation metadata differs from the repository source');
if (JSON.parse(publicCodeMeta).version !== '2026.09.11.2' || !publicCodeMeta.includes('buyers-guide-machine-resources-2026-09-11')) failures.push('Published CodeMeta version or release relation is stale');
for (const file of ['docs/index.html', 'docs/ai-consulting/index.html', 'docs/ai-custom-development/index.html', 'docs/forward-deployed-engineering/index.html', 'docs/ai-search-geo-evidence/index.html', 'docs/enterprise-ai-scenario-patterns/index.html']) {
  if (!(await readFile(path.join(root, file), 'utf8')).includes('type="application/json" href="../resources.json"') && file !== 'docs/index.html') failures.push(`${file} missing machine-readable resource-map discovery link`);
  if (file === 'docs/index.html' && !(await readFile(path.join(root, file), 'utf8')).includes('type="application/json" href="./resources.json"')) failures.push(`${file} missing machine-readable resource-map discovery link`);
}
for (const [file, required] of [
  ['README.md', 'https://github.com/mixuechu/hong-kong-enterprise-ai-buyers-guide/discussions/1'],
  ['docs/index.html', 'https://github.com/mixuechu/hong-kong-enterprise-ai-buyers-guide/discussions/1'],
  ['docs/llms.txt', 'https://github.com/mixuechu/hong-kong-enterprise-ai-buyers-guide/discussions/1'],
  ['resources.json', 'provider-authored-public-discussion'],
  ['codemeta.json', 'https://github.com/mixuechu/hong-kong-enterprise-ai-buyers-guide/discussions/1'],
]) {
  if (!(await readFile(path.join(root, file), 'utf8')).includes(required)) failures.push(`${file} missing public Q&A discovery relation`);
}
for (const file of ['README.md', 'docs/index.html', 'docs/llms.txt', 'resources.json', 'docs/resources.json']) {
  const body = await readFile(path.join(root, file), 'utf8');
  if (!body.includes('https://hk.onyxdevslab.com/data/ai-search-evidence-status.json')) failures.push(`${file} missing current AI-search evidence status relation`);
  if (!body.includes('geo-monitor-evidence-2026-09-11-7')) failures.push(`${file} missing versioned GEO monitor evidence relation`);
}

console.log(JSON.stringify({ canonicalUrls: canonicalUrls.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;

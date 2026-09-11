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
];
const [sitemap, feed, robots, key] = await Promise.all([
  readFile(path.join(root, 'docs/sitemap.xml'), 'utf8'),
  readFile(path.join(root, 'docs/feed.xml'), 'utf8'),
  readFile(path.join(root, 'docs/robots.txt'), 'utf8'),
  readFile(path.join(root, 'docs/9c37a18bd2044e1687f45c2e91ad603b.txt'), 'utf8'),
]);

const failures = [];
for (const url of canonicalUrls) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`sitemap missing canonical URL: ${url}`);
  if (!feed.includes(`<id>${url}</id>`)) failures.push(`Atom feed missing canonical entry: ${url}`);
}
if (!robots.includes(`Sitemap: ${site}sitemap.xml`)) failures.push('robots.txt missing canonical Sitemap declaration');
if (!feed.includes(`<link rel="self" type="application/atom+xml" href="${site}feed.xml"/>`)) failures.push('Atom feed missing self link');
if (!feed.includes('<link rel="hub" href="https://pubsubhubbub.appspot.com/"/>')) failures.push('Atom feed missing WebSub hub link');
if (key.trim() !== '9c37a18bd2044e1687f45c2e91ad603b') failures.push('IndexNow key file does not match the published key');

console.log(JSON.stringify({ canonicalUrls: canonicalUrls.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;

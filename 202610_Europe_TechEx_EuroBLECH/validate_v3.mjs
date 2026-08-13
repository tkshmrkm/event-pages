import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index_v3.html'), 'utf8');
const css = readFileSync(join(here, 'v3.css'), 'utf8');
const js = readFileSync(join(here, 'v3.js'), 'utf8');
const hrsCss = readFileSync(join(here, '..', '202609_HumanoidSummitEurope', 'v3.css'), 'utf8');
const itinerary = html.slice(html.indexOf('id="tab-itinerary"'), html.indexOf('id="tab-prep"'));

const count = pattern => (html.match(pattern) || []).length;
const checks = [
  ['HRS public stylesheet linked', html.includes('href="../202609_HumanoidSummitEurope/v3.css"')],
  ['local v3 assets linked', html.includes('href="v3.css"') && html.includes('src="v3.js"')],
  ['no v2 runtime dependency', !/v2\.(?:css|js)/.test(html)],
  ['five primary tabs', count(/data-tab="(?:itinerary|prep|venue|rec|family)"/g) === 5],
  ['nine HRS detail day cards', count(/<details class="day"/g) === 9],
  ['all day cards initially open', count(/<details class="day"[^>]* open/g) === 9],
  ['nine day topic blocks', count(/class="day-topics"/g) === 9],
  ['all lodging outcomes present', count(/class="stay stay-/g) === 11],
  ['static four-column routes present', count(/class="route-four"/g) >= 30],
  ['three overnight +1 arrivals', count(/<time>\d{2}:\d{2} \+1<\/time>/g) === 3],
  ['no repeated month/day in endpoints', !/class="endpoint"[\s\S]{0,180}<time>\d{1,2}\/\d{1,2}/.test(itinerary)],
  ['no colored airplane emoji in itinerary', !/[✈🛫🛬]\uFE0F/.test(itinerary)],
  ['four-column mobile contract retained', /@media\(max-width:640px\)[\s\S]*\.route-four,.lanes \.route-four\{grid-template-columns:82px minmax\(0,1fr\) 88px minmax\(0,1fr\)\}/.test(css)],
  ['HRS final font stack', hrsCss.includes("--font:'BIZ UDPGothic','Yu Gothic UI','Meiryo',system-ui,sans-serif")],
  ['HRS date navigation behavior', js.includes('function markDay()') && js.includes("todayCard.classList.add('today')") && js.includes('day.open = true')],
  ['browser-local records retained', js.includes("const FIELD_KEY = 'eurotrip2026-v3'") && js.includes('localStorage.setItem')],
];

new vm.Script(js, { filename: 'v3.js' });
const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([label, ok]) => console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`));
if (failed.length) process.exit(1);

import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const configContext = {window:{}};
vm.runInNewContext(readFileSync('js/site.config.js','utf8'), configContext);
const config = configContext.window.SITE_CONFIG;
const source = readFileSync('js/phone-conversion.js','utf8');
function boot(host='ciscenjeubeogradu.com', stored=null) {
  const handlers = {}, nodes = [], scripts = [];
  const document = {
    createElement: () => { const n = { setAttribute(){}, addEventListener(type,fn){ this[type]=fn; }, querySelector(){return {focus(){}};} }; nodes.push(n); return n; },
    head: { append: n => scripts.push(n) }, body:{append(){}},
    querySelector: () => ({append(){}}), addEventListener: (type,fn) => handlers[type]=fn,
  };
  const context = {window:{SITE_CONFIG:config}, location:{protocol:host==='localhost'?'http:':'https:',hostname:host}, URL, Date, document, localStorage:{getItem:()=>stored,setItem(){}}, encodeURIComponent};
  vm.runInNewContext(source, context);
  const events = () => (context.window.dataLayer || []).filter(a=>a[0]==='event');
  const click = (href='tel:'+config.PHONE_NUMBER) => handlers.click({defaultPrevented:false,target:{closest:()=>({getAttribute:()=>href})}});
  return {context,nodes,scripts,events,click};
}
const local = boot('localhost'); assert.equal(local.nodes.length,0); assert.equal(local.scripts.length,0);
const denied = boot(); assert.equal(denied.scripts.length,0); denied.click(); assert.equal(denied.events().length,0);
denied.nodes[0].click({target:{closest:()=>({dataset:{measurement:'no'}})}}); denied.click(); assert.equal(denied.scripts.length,0); assert.equal(denied.events().length,0);
const yes = boot(); yes.nodes[0].click({target:{closest:()=>({dataset:{measurement:'yes'}})}}); assert.equal(yes.scripts.length,1); assert.equal(yes.events().length,0);
yes.click(); assert.equal(yes.events().length,1); assert.equal(yes.events()[0][2].send_to,'AW-18482209563/D1l5CLW_67EdEJvGgO1E');
yes.click('tel:+3811111111'); assert.equal(yes.events().length,1);
yes.nodes[0].click({target:{closest:()=>({dataset:{measurement:'no'}})}}); yes.click(); assert.equal(yes.events().length,1);
const restored = boot('ciscenjeubeogradu.com',JSON.stringify({granted:true,expires:Date.now()+10000})); assert.equal(restored.scripts.length,1);
let count=0;
for (const file of readdirSync('.').filter(f=>f.endsWith('.html'))) {
  const html=readFileSync(file,'utf8'); assert(!html.includes('+38162770593'),file+' has old phone');
  assert.equal((html.match(/class="persistent-call"/g)||[]).length,1,file);
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (/Zatraži procenu/.test(match[2]) && /href="(?!kontakt\.html)[^"?#]+\.html"/.test(match[1])) continue;
    if (/Zatraži procenu|Pozovi/.test(match[2]) || /data-contact="phone"/.test(match[1])) {
      assert(match[1].includes('href="tel:+381603273705"'), file+' wrong CTA '+match[0]); count++;
    }
  }
}
const home = readFileSync('index.html','utf8');
for (const page of ['ciscenje-zgrada','ciscenje-poslovnog-prostora','ordinacije-i-kancelarije','ciscenje-podruma','odnosenje-suta']) {
  assert(home.includes('href="'+page+'.html">Zatraži procenu'), 'Missing service card destination: '+page);
}
assert(!/<header\b[\s\S]*?Zakaži čišćenje[\s\S]*?<\/header>/.test(home),'Header must offer a call');
console.log('PASS: consent, refusal, revocation, production-only tracking, exact conversion destination; '+count+' phone CTAs across 26 pages. No requests sent.');

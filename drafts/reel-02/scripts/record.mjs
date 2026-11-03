// Registra schermate REALI di personaltrainerboard.com in viewport mobile 390x844 (@2x).
// Usa SOLO l'account di test in .env e clienti demo inventati (nessun dato reale).
// Uso: node --env-file=.env scripts/record.mjs
// Output: public/clips/pt.mp4, pdf.mp4, client.mp4 (780x1688, 30fps) + markers.json (secondi dei passaggi chiave)
//
// Selettori verificati sul codice di index.html / share.html (LANGS.it, campi ff-<name>).
// Con HEADED=1 si vede il browser, con PWDEBUG=1 si va passo passo.
// Se la rete blocca i CDN (unpkg/jsdelivr/gstatic): CDN_MIRROR=<cartella con node_modules> → vedi scripts/cdn-mirror.mjs
import {createRequire} from 'node:module';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {mirrorCdn} from './cdn-mirror.mjs';

// playwright: locale se installato, altrimenti quello globale
const req = createRequire(import.meta.url);
let pw;
try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const {chromium} = pw;

const BASE = process.env.PTB_BASE_URL || 'https://personaltrainerboard.com';
const EMAIL = process.env.PTB_TEST_EMAIL;
const PASS = process.env.PTB_TEST_PASSWORD;
if (!EMAIL || !PASS) throw new Error('Manca PTB_TEST_EMAIL / PTB_TEST_PASSWORD in .env');
if (/stevetsala22@gmail\.com/i.test(EMAIL)) throw new Error("Usa un account di TEST dedicato, non l'account admin.");

const OUT = 'public/clips';
fs.mkdirSync('.auth', {recursive: true});
fs.mkdirSync(OUT, {recursive: true});
const VIEW = {width: 390, height: 844};
const markers = {};

// Clienti DEMO inventati (stesso formato di buildDemoPatient in index.html)
const today = new Date().toLocaleDateString('it-IT');
const demo = (id, nome, cognome, sesso, anno, alt, peso, obiettivo, attivita) => ({
  id, nome, cognome, sesso, ddn: `01/01/${anno}`, annoNascita: anno, altezza: alt, peso, vita: '', fianchi: '', pa: '120/80', fc: 70,
  patologie: '', farmaci: '', attivita, obiettivo, stressPercepito: 'Medio', sonno: '7', preferenze: '', sintomiSforzo: 'NO', allergie: '',
  email: '', telefono: '', dataValutazione: today, createdAt: today, test: {}, programma: {}, nutrizione: {}, progressi: [], schede: [], log: [],
});
const DEMO_PATIENTS = [
  demo('DEMO-101', 'Giulia', 'Ferri', 'F', 1992, 166, 61, 'Tonificazione', 'Leggera'),
  demo('DEMO-102', 'Marco', 'Bellini', 'M', 1985, 178, 84, 'Perdere peso', 'Sedentaria'),
  demo('DEMO-103', 'Elena', 'Ricci', 'F', 1978, 162, 58, 'Salute generale', 'Attiva'),
  demo('DEMO-104', 'Luca', 'Moretti', 'M', 1996, 182, 77, 'Aumentare massa', 'Attiva'),
  demo('DEMO-105', 'Chiara', 'Galli', 'F', 1988, 170, 66, 'Resistenza', 'Leggera'),
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Registrazione ad alta risoluzione via screencast CDP (pixel reali @2x = 780x1688).
// Il recordVideo di Playwright cattura solo a risoluzione CSS (390x844): troppo sgranato per un reel.
// Ritorna {t0, stop()} — stop() monta i fotogrammi in un mp4 a 30fps costanti.
async function screencast(page, outFile) {
  const dir = outFile + '.frames';
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({data, metadata, sessionId}) => {
    const file = `${dir}/${String(frames.length).padStart(5, '0')}.jpg`;
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({file, t: metadata.timestamp * 1000});
    await cdp.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
  });
  const t0 = Date.now();
  await cdp.send('Page.startScreencast', {format: 'jpeg', quality: 92, maxWidth: VIEW.width * 2, maxHeight: VIEW.height * 2, everyNthFrame: 1});
  return {
    t0,
    async stop() {
      const tEnd = Date.now();
      await cdp.send('Page.stopScreencast').catch(() => {});
      await sleep(300);
      // concat ffmpeg: ogni fotogramma dura fino al successivo; il primo parte da t0
      const lines = [];
      frames.forEach((f, i) => {
        const start = i === 0 ? t0 : f.t;
        const end = i + 1 < frames.length ? frames[i + 1].t : tEnd;
        lines.push(`file '${path.resolve(f.file)}'`, `duration ${Math.max(0.001, (end - start) / 1000).toFixed(3)}`);
      });
      lines.push(`file '${path.resolve(frames.at(-1).file)}'`);
      fs.writeFileSync(dir + '/list.txt', lines.join('\n'));
      execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${dir}/list.txt" -vf "fps=30,scale=780:1688:force_original_aspect_ratio=decrease,pad=780:1688:(ow-iw)/2:0:color=white,format=yuv420p" -c:v libx264 -crf 16 -preset medium "${outFile}"`);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log(`✓ ${outFile} (${frames.length} fotogrammi, ${((tEnd - t0) / 1000).toFixed(1)}s)`);
    },
  };
}

// Indicatore di tocco visibile nella registrazione
const TAP_CSS = `
  .__tap{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(37,99,235,.25);
  border:3px solid #2563eb;pointer-events:none;z-index:2147483647;animation:__tap .45s ease-out forwards}
  @keyframes __tap{from{transform:scale(.6);opacity:1}to{transform:scale(1.8);opacity:0}}`;
const injectTaps = (page) =>
  page.addInitScript((css) => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    });
    addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.className = '__tap';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 500);
    }, true);
  }, TAP_CSS);

const proxy = process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined;
// In caso di errore: screenshot della pagina corrente in out/fail.png
let current = null;
const fail = async (e) => {
  console.error(e);
  fs.mkdirSync('out', {recursive: true});
  if (current) await current.screenshot({path: 'out/fail.png'}).catch(() => {});
  process.exit(1);
};
process.on('unhandledRejection', fail);
process.on('uncaughtException', fail);
const browser = await chromium.launch({headless: !process.env.HEADED, proxy});

// Contesto comune: mobile, niente redirect alla landing, banner cookie già chiuso, CDN mirror se serve
const newCtx = async (extra = {}) => {
  const ctx = await browser.newContext({viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT', ignoreHTTPSErrors: !!proxy, ...extra});
  await mirrorCdn(ctx);
  // SHARE_HTML=<percorso>: serve una share.html locale (es. con fix non ancora in produzione)
  if (process.env.SHARE_HTML) await ctx.route(/\/share\.html/, (r) => r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(process.env.SHARE_HTML)}));
  await ctx.addInitScript(() => {
    try { localStorage.setItem('ptb_entered', '1'); } catch (e) {}
  });
  return ctx;
};
const closeCookies = (page) => page.getByText('Solo necessari').click({timeout: 4000}).catch(() => {});
const t0 = {pt: 0, client: 0, pdf: 0};
const mark = (track, name) => (markers[`${track}:${name}`] = +((Date.now() - t0[track]) / 1000).toFixed(2));

// Tocco "umano": muove il dito sull'elemento, piccola pausa, tap
// PACE: moltiplica pause e digitazione (1 = veloce da script, ~1.8 = ritmo umano realistico)
const PACE = +(process.env.PACE || 1);
const tap = async (page, loc) => {
  await loc.scrollIntoViewIfNeeded();
  await sleep(250 * PACE);
  await loc.tap();
  await sleep(350 * PACE);
};
const typeSlow = async (loc, text) => {
  await loc.tap();
  await loc.pressSequentially(String(text), {delay: Math.round(70 * PACE)});
};

// SHARE_URL=<link /s/…>: rifà solo la clip cliente (niente login, niente nuovo cliente demo)
const ONLY_CLIENT = process.env.SHARE_URL;
if (fs.existsSync(OUT + '/markers.json') && ONLY_CLIENT) Object.assign(markers, JSON.parse(fs.readFileSync(OUT + '/markers.json', 'utf8')));

// ── 1) Login + seed (NON registrato) ──
if (!ONLY_CLIENT) {
  const ctx = await newCtx();
  const page = await ctx.newPage();
  current = page;
  await page.goto(BASE + '/index.html', {waitUntil: 'load'});
  await closeCookies(page);
  await page.getByText('Accedi', {exact: true}).first().click(); // la schermata parte su "Crea account"
  await page.locator('input[type=email]').first().fill(EMAIL);
  await page.locator('input[type=password]').first().fill(PASS);
  await page.getByRole('button', {name: /^Accedi$/}).last().click();
  await page.waitForFunction(() => window.fbAuth && fbAuth.currentUser, null, {timeout: 30000}).catch(async () => {
    throw new Error('Login fallito: ' + ((await page.innerText('body')).match(/Email o password errati|[^\n]*errat[^\n]*/)?.[0] || 'timeout'));
  });
  // Seed solo se l'account di test è vuoto: mai sovrascrivere dati esistenti
  const res = await page.evaluate(async (patients) => {
    const uid = fbAuth.currentUser.uid;
    const cur = await fbLoadStrict(uid);
    if (cur && cur.patients && cur.patients.length > 1) return 'già popolato (' + cur.patients.length + ')';
    await fbSave(uid, {...(cur || {}), patients: [...((cur && cur.patients) || []), ...patients], dataVersion: 4});
    return 'seed ok';
  }, DEMO_PATIENTS);
  console.log('Seed:', res);
  await ctx.storageState({path: '.auth/state.json', indexedDB: true});
  await ctx.close();
}

// ── 2) Registrazione PT: valutazione rapida → scheda auto → PDF → link cliente ──
let shareUrl = ONLY_CLIENT || null;
if (!ONLY_CLIENT) {
  const ctx = await newCtx({storageState: '.auth/state.json'});
  const page = await ctx.newPage();
  current = page;
  await injectTaps(page);
  await page.goto(BASE + '/index.html', {waitUntil: 'load'});
  const recPt = await screencast(page, OUT + '/pt.mp4');
  t0.pt = recPt.t0;
  await closeCookies(page);
  // su mobile il pulsante è nella lista clienti
  const qa = page.getByText('⚡ Valutazione rapida').first();
  if (!(await qa.waitFor({timeout: 12000}).then(() => true, () => false))) {
    await tap(page, page.getByText('Vedi la lista completa e le schede').first());
  }
  await qa.waitFor({timeout: 30000});
  await sleep(1500);
  mark('pt', 'home');

  mark('pt', 'start'); // cronometro: parte al tocco su ⚡ Valutazione rapida
  await tap(page, qa);
  mark('pt', 'eval-open');
  await typeSlow(page.locator('#ff-nome'), 'Davide');
  await typeSlow(page.locator('#ff-cognome'), 'Conti');
  await tap(page, page.locator('#qa-sec-sex').getByRole('button', {name: 'M', exact: true}));
  await typeSlow(page.locator('#qa-sec-year input'), '1990');
  await typeSlow(page.locator('#ff-altezza'), '180');
  await typeSlow(page.locator('#ff-peso'), '82');
  mark('pt', 'eval-anagrafica');
  await tap(page, page.getByRole('button', {name: 'Intermedio', exact: true}).first());
  await tap(page, page.locator('#qa-sec-goal').getByRole('button', {name: /Aumentare massa/}));
  // PAR-Q+: 7 risposte NO
  const no = page.getByRole('button', {name: 'NO', exact: true});
  for (let i = 0; i < 7; i++) await tap(page, no.nth(i));
  mark('pt', 'eval-parq');

  await tap(page, page.getByText('Genera scheda ⚡').first());
  mark('pt', 'generate');
  // cronometro: si ferma quando compare la notifica "Scheda generata"
  await page.getByText(/Scheda generata|schede generate/).first().waitFor({timeout: 30000});
  mark('pt', 'toast');
  // dopo la generazione si apre il cliente: la scheda è nella tab Programma
  const progTab = page.getByText('Programma', {exact: true}).first();
  await progTab.waitFor({timeout: 30000});
  await sleep(1200);
  await tap(page, progTab);
  await sleep(700);
  // accordion "Schede allenamento" → prima scheda
  const secSchede = page.getByText('Schede allenamento', {exact: true}).first();
  await tap(page, secSchede);
  const box = secSchede.locator('xpath=ancestor::div[contains(@style,"margin-top: 20px")][1]');
  await tap(page, box.locator('div[style*="cursor: pointer"]').nth(1));
  await page.getByText('📄 Esporta PDF').first().waitFor({timeout: 30000});
  await sleep(600);
  // porta l'intestazione della scheda in alto, poi scroll fluido fino al pulsante Esporta PDF
  // l'app scorre in un contenitore interno (non window): lo cerco risalendo dall'intestazione della scheda
  await page.evaluate(() => {
    const h = [...document.querySelectorAll('div')].find((d) => d.style.cursor === 'pointer' && /^B?\d*\s*(Full Body|Upper|Lower|Push|Pull|Legs)/.test(d.textContent.trim()));
    let sc = h;
    while (sc && !(sc.scrollHeight > sc.clientHeight + 10 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    sc = sc || document.scrollingElement;
    window.__sc = sc;
    sc.scrollTop += h.getBoundingClientRect().top - sc.getBoundingClientRect().top - 40;
  });
  await sleep(900);
  mark('pt', 'scheda');
  await page.evaluate(() => new Promise((done) => {
    const sc = window.__sc;
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Esporta PDF'));
    const from = sc.scrollTop;
    const to = Math.min(sc.scrollHeight - sc.clientHeight, from + btn.getBoundingClientRect().bottom - sc.getBoundingClientRect().bottom + 40);
    const T = 4500, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / T);
      sc.scrollTop = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }));
  mark('pt', 'scheda-end');
  await sleep(700);

  // Esporta PDF: l'anteprima si apre in una nuova finestra → registrata a parte (pdf.mp4)
  const [pdfPage] = await Promise.all([ctx.waitForEvent('page'), tap(page, page.getByText('📄 Esporta PDF').first())]);
  mark('pt', 'pdf');
  await pdfPage.waitForLoadState('load');
  const recPdf = await screencast(pdfPage, OUT + '/pdf.mp4');
  t0.pdf = recPdf.t0;
  await sleep(1200);
  mark('pdf', 'open');
  for (let i = 0; i < 6; i++) await pdfPage.mouse.wheel(0, 300), await sleep(380);
  await sleep(800);
  await recPdf.stop();
  await pdfPage.close();

  await tap(page, page.getByText('🔗 Condividi con cliente').first());
  mark('pt', 'share');
  await page.locator('a[href*="wa.me"]').first().waitFor({timeout: 20000}).catch(() => {});
  await sleep(1500);
  shareUrl = await page.evaluate(() => {
    // il link compare solo dentro l'href WhatsApp (wa.me/?text=…)
    const vals = [...document.querySelectorAll('a[href*="wa.me"]')].map((a) => decodeURIComponent(a.href))
      .concat([...document.querySelectorAll('input')].map((i) => i.value), document.body.innerText);
    for (const v of vals) { const m = (v || '').match(/(https?:\/\/)?[\w.-]+\/s\/[\w-]+/); if (m) return m[1] ? m[0] : 'https://' + m[0]; }
    return null;
  });
  await sleep(800);
  await recPt.stop();
  await ctx.close();
  console.log('share:', shareUrl);
}

// ── 3) Registrazione cliente: link condiviso, timer di recupero, salva seduta ──
if (shareUrl) {
  const ctx = await newCtx();
  const page = await ctx.newPage();
  current = page;
  await injectTaps(page);
  await page.goto(shareUrl, {waitUntil: 'load'});
  const recCl = await screencast(page, OUT + '/client.mp4');
  t0.client = recCl.t0;
  await page.locator('.set-check').first().waitFor({timeout: 30000});
  await sleep(1500);
  mark('client', 'open');
  // prima serie: peso + reps (il ✓ li richiede), poi ✓ → parte il timer di recupero
  const row = page.locator('.set-check').first().locator('xpath=..');
  await typeSlow(row.locator('input.set-input').nth(0), '40');
  await typeSlow(row.locator('input.set-input').nth(1), '10');
  await tap(page, page.locator('.set-check').first());
  mark('client', 'timer');
  await sleep(4000);
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 300), await sleep(400);
  await tap(page, page.locator('#btnSave'));
  mark('client', 'saved');
  await sleep(2500);
  await recCl.stop();
  await ctx.close();
}

fs.writeFileSync(OUT + '/markers.json', JSON.stringify(markers, null, 1));
console.log(markers);
await browser.close();

// Registra schermate REALI di personaltrainerboard.com in viewport mobile 390x844 (@2x).
// Usa SOLO l'account di test in .env e clienti demo inventati (nessun dato reale).
// Uso: node --env-file=.env scripts/record.mjs
// Output: public/clips/pt.webm, public/clips/client.webm, public/clips/markers.json (secondi dei passaggi chiave)
//
// NB: i selettori usano le etichette italiane dell'app (LANGS.it). Al primo giro sul sito live
// vanno verificati: con HEADED=1 si vede il browser, con PWDEBUG=1 si va passo passo.
import {chromium} from 'playwright';
import fs from 'node:fs';

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
  demo('DEMO-104', 'Luca', 'Moretti', 'M', 1996, 182, 77, 'Massa muscolare', 'Attiva'),
  demo('DEMO-105', 'Chiara', 'Galli', 'F', 1988, 170, 66, 'Resistenza', 'Leggera'),
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

const browser = await chromium.launch({headless: !process.env.HEADED});
const t0 = {pt: 0, client: 0};
const mark = (track, name) => (markers[`${track}:${name}`] = +((Date.now() - t0[track]) / 1000).toFixed(2));

// Tocco "umano": muove il dito sull'elemento, piccola pausa, tap
const tap = async (page, loc) => {
  await loc.scrollIntoViewIfNeeded();
  await sleep(250);
  await loc.tap();
  await sleep(350);
};
const typeSlow = async (loc, text) => {
  await loc.tap();
  await loc.pressSequentially(String(text), {delay: 70});
};

// ── 1) Login + seed (NON registrato) ──
{
  const ctx = await browser.newContext({viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT'});
  const page = await ctx.newPage();
  await page.goto(BASE + '/index.html', {waitUntil: 'networkidle'});
  await page.getByPlaceholder(/email/i).first().fill(EMAIL);
  await page.locator('input[type=password]').first().fill(PASS);
  await page.getByRole('button', {name: /^Accedi$/}).click();
  await page.waitForFunction(() => window.fbAuth && fbAuth.currentUser, null, {timeout: 30000});
  // Seed solo se l'account di test è vuoto: mai sovrascrivere dati esistenti
  const res = await page.evaluate(async (patients) => {
    const uid = fbAuth.currentUser.uid;
    const cur = await fbLoadStrict(uid);
    if (cur && cur.patients && cur.patients.length > 1) return 'già popolato (' + cur.patients.length + ')';
    await fbSave(uid, {...(cur || {}), patients: [...((cur && cur.patients) || []), ...patients], dataVersion: 4});
    return 'seed ok';
  }, DEMO_PATIENTS);
  console.log('Seed:', res);
  await ctx.storageState({path: '.auth/state.json'});
  await ctx.close();
}

// ── 2) Registrazione PT: valutazione rapida → scheda auto → PDF → link cliente ──
let shareUrl = null;
{
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT',
    storageState: '.auth/state.json', recordVideo: {dir: OUT + '/tmp-pt', size: {width: 780, height: 1688}},
  });
  const page = await ctx.newPage();
  await injectTaps(page);
  t0.pt = Date.now();
  await page.goto(BASE + '/index.html', {waitUntil: 'networkidle'});
  await sleep(1500);
  mark('pt', 'home');

  await tap(page, page.getByText('⚡ Valutazione rapida').first());
  mark('pt', 'eval-open');
  const field = (label) => page.locator(`label:has-text("${label}")`).locator('xpath=following::input[1]').first();
  await typeSlow(field('Nome'), 'Davide');
  await typeSlow(field('Cognome'), 'Conti');
  await tap(page, page.getByRole('button', {name: /^M$/}).first());
  await typeSlow(field('Anno di nascita'), '1990');
  await typeSlow(field('Altezza'), '180');
  await typeSlow(field('Peso'), '82');
  mark('pt', 'eval-anagrafica');
  await tap(page, page.getByText('Intermedio', {exact: true}).first());
  await tap(page, page.getByText('Massa muscolare').first());
  // PAR-Q+: 7 risposte NO
  const no = page.getByRole('button', {name: /^NO$/});
  for (let i = 0; i < 7; i++) await tap(page, no.nth(i));
  mark('pt', 'eval-parq');

  await tap(page, page.getByText('Genera scheda ⚡').first());
  mark('pt', 'generate');
  await sleep(2500);
  mark('pt', 'scheda');
  // scroll lento sulla scheda generata
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 260), await sleep(450);
  await sleep(600);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -260), await sleep(200);

  await tap(page, page.getByText(/Esporta PDF/).first());
  mark('pt', 'pdf');
  await sleep(2500);
  await page.keyboard.press('Escape').catch(() => {});

  await tap(page, page.getByText('🔗 Condividi con cliente').first());
  mark('pt', 'share');
  await sleep(1500);
  shareUrl = await page.evaluate(() => {
    const el = [...document.querySelectorAll('input,a,div,span')].find((e) => /\/s\/[\w-]+/.test(e.value || e.textContent || ''));
    return el ? (el.value || el.textContent).match(/https?:\/\/\S+\/s\/[\w-]+/)?.[0] : null;
  });
  await sleep(800);
  await ctx.close();
  const v = fs.readdirSync(OUT + '/tmp-pt')[0];
  fs.renameSync(`${OUT}/tmp-pt/${v}`, `${OUT}/pt.webm`);
  console.log('✓ pt.webm  share:', shareUrl);
}

// ── 3) Registrazione cliente: link condiviso, timer di recupero, salva seduta ──
if (shareUrl) {
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT',
    recordVideo: {dir: OUT + '/tmp-client', size: {width: 780, height: 1688}},
  });
  const page = await ctx.newPage();
  await injectTaps(page);
  t0.client = Date.now();
  await page.goto(shareUrl, {waitUntil: 'networkidle'});
  await sleep(1500);
  mark('client', 'open');
  // spunta la prima serie → parte il timer di recupero
  const set = page.locator('input[type=checkbox], .set-check, [data-set]').first();
  await tap(page, set);
  mark('client', 'timer');
  await sleep(4000);
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 300), await sleep(400);
  await tap(page, page.getByText('Salva seduta').first());
  mark('client', 'saved');
  await sleep(2500);
  await ctx.close();
  const v = fs.readdirSync(OUT + '/tmp-client')[0];
  fs.renameSync(`${OUT}/tmp-client/${v}`, `${OUT}/client.webm`);
  console.log('✓ client.webm');
}

fs.writeFileSync(OUT + '/markers.json', JSON.stringify(markers, null, 1));
console.log(markers);
await browser.close();

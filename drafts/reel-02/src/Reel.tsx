import React from 'react';
import {AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SCENES} from './timeline';
import {Captions} from './Captions';
import {FONT, SAFE_TOP} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = {...clamp, easing: Easing.inOut(Easing.cubic)};

// Palette scura, coerente con il tema dell'app PT
const K = {
  bg: '#060a14',
  card: 'rgba(15,23,42,0.78)',
  line: 'rgba(148,163,184,0.18)',
  text: '#f8fafc',
  muted: '#94a3b8',
  blue: '#3b82f6',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  green: '#22c55e',
};
const GRAD = `linear-gradient(135deg, ${K.blue}, ${K.cyan} 55%, ${K.violet})`;

// ── Cronometro: dati reali dalla registrazione (public/clips/markers.json) ──
// race: pt.mp4 da RACE_SRC a velocità RACE_RATE. Il cronometro mostra il tempo REALE della registrazione:
// parte al tocco su "⚡ Valutazione rapida" (pt:start) e si ferma alla notifica "Scheda generata" (pt:toast).
const T_START = 18.69;
const T_STOP = 35.59;
const RACE_SRC = 18.45;
const RACE_RATE = 2.5;
export const STOP_SEC = T_STOP - T_START; // 16,9 s
const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r.toFixed(1).padStart(4, '0').replace('.', ',')}`;
};

// ── Sfondo: blu notte con bagliori che respirano ──
const Bg: React.FC<{hue?: 'blue' | 'green'}> = ({hue = 'blue'}) => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 40) * 60;
  const c1 = hue === 'green' ? 'rgba(34,197,94,0.28)' : 'rgba(59,130,246,0.30)';
  return (
    <AbsoluteFill style={{background: K.bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 1100, height: 1100, left: -300 + a, top: -250, borderRadius: '50%', background: `radial-gradient(circle, ${c1}, transparent 65%)`}} />
      <div style={{position: 'absolute', width: 1000, height: 1000, right: -350 - a, bottom: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.22), transparent 65%)'}} />
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)', backgroundSize: '90px 90px'}} />
    </AbsoluteFill>
  );
};

// ── Telefono con registrazione reale ──
type Z = {f: number; s: number; x: number; y: number; ty?: number};
const Phone: React.FC<{src: string; startSec: number; rate?: number; width: number; top: number; zoom?: Z[]; freeze?: boolean}> = ({src, startSec, rate = 1, width, top, zoom = [{f: 0, s: 1, x: 195, y: 422}], freeze}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const kf = zoom.map((k) => k.f);
  const ip = (sel: (k: Z) => number) => (zoom.length > 1 ? interpolate(f, kf, zoom.map(sel), ease) : sel(zoom[0]));
  const s = ip((k) => k.s);
  const fx = ip((k) => k.x);
  const fy = ip((k) => k.y);
  const ty = ip((k) => k.ty || 0);
  const k = width / 390;
  const h = 844 * k;
  const enter = spring({frame: f, fps, config: {damping: 15, stiffness: 170}});
  const video = <OffthreadVideo src={staticFile(src)} startFrom={Math.round(startSec * fps)} playbackRate={rate} muted style={{width, height: h, objectFit: 'cover', display: 'block'}} />;
  return (
    <div style={{position: 'absolute', left: (1080 - width) / 2, top, width, height: h, transform: `translateY(${ty + interpolate(enter, [0, 1], [80, 0])}px)`, opacity: enter}}>
      <div style={{position: 'absolute', inset: -16, borderRadius: 64, background: '#020617', boxShadow: `0 0 0 3px rgba(148,163,184,0.25), 0 50px 140px rgba(59,130,246,0.35)`}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 50, overflow: 'hidden', background: '#0b1220'}}>
        <div style={{width, height: h, transformOrigin: `${fx * k}px ${fy * k}px`, transform: `scale(${s})`}}>{freeze ? <Freeze frame={0}>{video}</Freeze> : video}</div>
      </div>
    </div>
  );
};

// ── Cronometro digitale con anello ──
const Stopwatch: React.FC<{sec: number; size?: number; stopped?: boolean; label?: string}> = ({sec, size = 1, stopped, label}) => {
  const f = useCurrentFrame();
  const col = stopped ? K.green : K.cyan;
  const pct = Math.min(1, sec / 60);
  const R = 120;
  const blink = stopped ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(f / 6));
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 34 * size, transform: `scale(${size})`, transformOrigin: 'center'}}>
      <svg width={2 * R + 30} height={2 * R + 30} viewBox={`-15 -15 ${2 * R + 30} ${2 * R + 30}`}>
        <circle cx={R} cy={R} r={R - 10} fill="rgba(2,6,23,0.6)" stroke={K.line} strokeWidth={14} />
        <circle cx={R} cy={R} r={R - 10} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * (R - 10) * pct} 9999`} transform={`rotate(-90 ${R} ${R})`} style={{filter: `drop-shadow(0 0 14px ${col})`}} />
        <line x1={R} y1={R} x2={R + (R - 38) * Math.sin(2 * Math.PI * (sec % 60) / 60)} y2={R - (R - 38) * Math.cos(2 * Math.PI * (sec % 60) / 60)} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        <circle cx={R} cy={R} r={12} fill={col} />
        <rect x={R - 22} y={-14} width={44} height={18} rx={6} fill={col} />
      </svg>
      <div style={{fontFamily: FONT}}>
        {label && <div style={{fontSize: 34, fontWeight: 800, letterSpacing: 4, color: col, opacity: blink}}>{label}</div>}
        <div style={{fontSize: 150, fontWeight: 900, color: K.text, fontVariantNumeric: 'tabular-nums', letterSpacing: -4, lineHeight: 1, textShadow: `0 0 40px ${col}66`}}>{fmt(sec)}</div>
      </div>
    </div>
  );
};

const Pill: React.FC<{children: React.ReactNode; at: number; color?: string; big?: boolean}> = ({children, at, color = K.blue, big}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 11, stiffness: 260}});
  if (f < at) return null;
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: big ? '18px 34px' : '14px 26px', borderRadius: 999, background: K.card, border: `2px solid ${color}`, boxShadow: `0 0 30px ${color}55`, color: K.text, fontFamily: FONT, fontWeight: 800, fontSize: big ? 50 : 40, transform: `scale(${interpolate(s, [0, 1], [0.4, 1])})`, opacity: s}}>
      {children}
    </div>
  );
};
const Check: React.FC<{color?: string}> = ({color = K.green}) => (
  <span style={{display: 'inline-flex', width: 44, height: 44, borderRadius: '50%', background: color, alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#04120a', fontWeight: 900}}>✓</span>
);

// ── 1) HOOK: domanda cinetica + cronometro fermo ──
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rows: [string, number, boolean?][] = [['QUANTO CI METTI', 4], ['A FARE UNA', 36], ['SCHEDA', 50, true], ['SU MISURA?', 59, true]];
  const watch = spring({frame: f - 78, fps, config: {damping: 12, stiffness: 150}});
  const via = f >= 112;
  const shake = f >= 112 && f < 120 ? Math.sin(f * 3) * 10 : 0;
  return (
    <AbsoluteFill style={{fontFamily: FONT, alignItems: 'center', transform: `translateX(${shake}px)`}}>
      <Bg />
      <div style={{position: 'absolute', top: SAFE_TOP + 20, width: '100%', textAlign: 'center'}}>
        {rows.map(([t, at, hl], i) => {
          const s = spring({frame: f - at, fps, config: {damping: 12, stiffness: 220}});
          return (
            <div key={i} style={{fontSize: hl ? 150 : 104, fontWeight: 900, letterSpacing: -4, lineHeight: 1.02, color: K.text, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) scale(${interpolate(s, [0, 1], [1.3, 1])})`, ...(hl ? {background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent'} : {})}}>
              {t}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1020, width: '100%', display: 'flex', justifyContent: 'center', opacity: interpolate(f, [20, 40], [0, 1], clamp), transform: `scale(${interpolate(watch, [0, 1], [0.8, 1.08])})`}}>
        <Stopwatch sec={0} label={via ? 'VIA!' : 'PRONTI…'} />
      </div>
      <div style={{position: 'absolute', top: 1360, opacity: interpolate(f, [84, 96], [0, 1], clamp), fontSize: 36, fontWeight: 700, letterSpacing: 3, color: K.muted}}>REGISTRAZIONE REALE · NESSUN TAGLIO</div>
      {via && <AbsoluteFill style={{background: K.cyan, opacity: interpolate(f, [112, 120], [0.45, 0], clamp)}} />}
    </AbsoluteFill>
  );
};

// ── 2) RACE: app reale accelerata, cronometro in tempo reale ──
const Race: React.FC = () => {
  const f = useCurrentFrame();
  const src = RACE_SRC + (f / 30) * RACE_RATE;
  const sec = Math.min(STOP_SEC, Math.max(0, src - T_START));
  // passi (frame della scena calcolati dai marker: (marker - RACE_SRC) / RATE * 30)
  const at = (m: number) => Math.round(((m - RACE_SRC) / RACE_RATE) * 30);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Bg />
      <Phone src="clips/pt.mp4" startSec={RACE_SRC} rate={RACE_RATE} width={600} top={640} zoom={[{f: 0, s: 1, x: 195, y: 422}, {f: 120, s: 1.08, x: 195, y: 380}, {f: 207, s: 1.08, x: 195, y: 600}]} />
      <div style={{position: 'absolute', top: SAFE_TOP - 10, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <Stopwatch sec={sec} size={0.82} label="⏱ TEMPO REALE" />
      </div>
      <div style={{position: 'absolute', top: 545, width: '100%', display: 'flex', justifyContent: 'center', gap: 14}}>
        <Pill at={at(23.84)} color={K.green}><Check />Anagrafica</Pill>
        <Pill at={at(26.1)} color={K.green}><Check />Obiettivo</Pill>
        <Pill at={at(34.31)} color={K.green}><Check />PAR-Q+</Pill>
      </div>
      <div style={{position: 'absolute', right: 70, top: 690, padding: '10px 20px', borderRadius: 14, background: 'rgba(2,6,23,0.75)', color: K.muted, fontWeight: 800, fontSize: 30}}>▶▶ ×{RACE_RATE.toString().replace('.', ',')}</div>
    </AbsoluteFill>
  );
};

// ── 3) STOP: 16,9 secondi ──
const Stop: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hit = spring({frame: f, fps, config: {damping: 8, stiffness: 260}});
  const stamp = spring({frame: f - 6, fps, config: {damping: 10, stiffness: 300}});
  const shake = f < 8 ? Math.sin(f * 4) * (8 - f) * 2 : 0;
  return (
    <AbsoluteFill style={{fontFamily: FONT, alignItems: 'center', transform: `translate(${shake}px, ${-shake}px)`}}>
      <Bg hue="green" />
      <div style={{opacity: 0.35, filter: 'blur(2px)'}}>
        <Phone src="clips/pt.mp4" startSec={T_STOP + 0.35} width={600} top={640} freeze />
      </div>
      <div style={{position: 'absolute', top: 560, transform: `scale(${interpolate(hit, [0, 1], [1.45, 0.92])})`}}>
        <Stopwatch sec={STOP_SEC} stopped label="STOP" />
      </div>
      <div style={{position: 'absolute', top: 920, padding: '24px 50px', borderRadius: 26, border: `8px solid ${K.green}`, color: K.green, fontSize: 82, fontWeight: 900, letterSpacing: 2, transform: `rotate(-6deg) scale(${interpolate(stamp, [0, 1], [2.2, 1])})`, opacity: stamp, background: 'rgba(2,6,23,0.6)'}}>
        SCHEDA PRONTA
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 6], [0.7, 0], clamp)}} />
    </AbsoluteFill>
  );
};

// ── 4) SCHEDA: prove (parametri reali in app) ──
const Scheda: React.FC = () => (
  <AbsoluteFill style={{fontFamily: FONT}}>
    <Bg />
    <Phone src="clips/pt.mp4" startSec={41.9} rate={0.95} width={640} top={720} zoom={[{f: 0, s: 1.08, x: 195, y: 380}, {f: 180, s: 1.15, x: 195, y: 470}]} />
    <div style={{position: 'absolute', top: SAFE_TOP, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18}}>
      <Pill at={29} big>🎯 Obiettivo</Pill>
      <Pill at={51} big>📈 Livello</Pill>
      <Pill at={71} big>🩹 Limitazioni</Pill>
      <Pill at={124} big color={K.violet}>📚 Linee guida NSCA · ACSM</Pill>
    </div>
    <div style={{position: 'absolute', top: 630, width: '100%', textAlign: 'center', color: K.muted, fontSize: 32, fontWeight: 700, letterSpacing: 3}}>SERIE · RIPETIZIONI · RECUPERI</div>
  </AbsoluteFill>
);

const Feature: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 2, fps, config: {damping: 12, stiffness: 220}});
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Bg />
      {children}
      <div style={{position: 'absolute', top: SAFE_TOP, width: '100%', textAlign: 'center'}}>
        <div style={{display: 'inline-block', padding: '20px 44px', borderRadius: 999, background: GRAD, color: '#fff', fontSize: 64, fontWeight: 900, boxShadow: '0 20px 60px rgba(59,130,246,0.45)', transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`, opacity: s}}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

// ── 6) CTA ──
const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = (d: number) => spring({frame: f - d, fps, config: {damping: 11, stiffness: 200}});
  const pulse = 1 + 0.045 * Math.sin((f / 15) * Math.PI);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Bg />
      <AbsoluteFill style={{alignItems: 'center'}}>
      <Img src={staticFile('logo.png')} style={{marginTop: SAFE_TOP + 30, width: 260, height: 260, borderRadius: 64, boxShadow: '0 0 120px rgba(59,130,246,0.6)', transform: `scale(${sp(0)}) rotate(${interpolate(sp(0), [0, 1], [-25, 0])}deg)`}} />
      <div style={{marginTop: 40, fontSize: 160, fontWeight: 900, letterSpacing: -6, background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent', transform: `scale(${sp(6)})`}}>PT Board</div>
      <div style={{marginTop: 10, fontSize: 48, fontWeight: 700, color: K.muted, opacity: sp(14)}}>Valutazione · Scheda · PDF · App cliente</div>
      <div style={{marginTop: 60, padding: '34px 80px', borderRadius: 999, background: K.blue, color: '#fff', fontSize: 78, fontWeight: 900, boxShadow: '0 0 80px rgba(59,130,246,0.7)', transform: `scale(${sp(30) * (f > 50 ? pulse : 1)})`}}>Provalo gratis</div>
      <div style={{marginTop: 34, fontSize: 46, fontWeight: 800, color: K.text, opacity: sp(42)}}>15 giorni · nessuna carta di credito</div>
      <div style={{marginTop: 18, fontSize: 40, fontWeight: 700, color: K.cyan, opacity: sp(52)}}>personaltrainerboard.com</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const render = (id: string) => {
  switch (id) {
    case 'hook': return <Hook />;
    case 'race': return <Race />;
    case 'stop': return <Stop />;
    case 'scheda': return <Scheda />;
    case 'pdf': return (
      <Feature title="📄 PDF in un tap">
        <Phone src="clips/pdf.mp4" startSec={0} width={700} top={520} zoom={[{f: 0, s: 1.05, x: 195, y: 300}, {f: 48, s: 1.3, x: 195, y: 340}]} />
      </Feature>
    );
    case 'client': return (
      <Feature title="📱 Sul telefono del cliente">
        <Phone src="clips/client.mp4" startSec={4.4} rate={1.1} width={660} top={560} zoom={[{f: 0, s: 1.15, x: 195, y: 420}, {f: 18, s: 1.15, x: 195, y: 420}, {f: 34, s: 1.05, x: 195, y: 810, ty: -740}, {f: 60, s: 1.05, x: 195, y: 810, ty: -740}]} />
      </Feature>
    );
    default: return <Cta />;
  }
};

// Taglio: punch-in + flash
const Cut: React.FC<{children: React.ReactNode; first?: boolean}> = ({children, first}) => {
  const f = useCurrentFrame();
  const scale = first ? 1 : interpolate(f, [0, 7], [1.1, 1], clamp);
  const blur = first ? 0 : interpolate(f, [0, 5], [14, 0], clamp);
  return <AbsoluteFill style={{transform: `scale(${scale})`, filter: `blur(${blur}px)`}}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{background: K.bg}}>
    {SCENES.map((s, i) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from}>
        <Cut first={i === 0}>{render(s.id)}</Cut>
      </Sequence>
    ))}
    {/* sottotitoli: non nell'hook (c'è già il testo cinetico) */}
    <Captions skip={[[0, 123]]} />
  </AbsoluteFill>
);

// Copertina
export const Cover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: FONT}}>
    <Bg />
    <AbsoluteFill style={{alignItems: 'center'}}>
    <div style={{marginTop: SAFE_TOP + 40, textAlign: 'center'}}>
      <div style={{fontSize: 110, fontWeight: 900, color: K.text, letterSpacing: -4, lineHeight: 1.02}}>SCHEDA</div>
      <div style={{fontSize: 150, fontWeight: 900, letterSpacing: -5, lineHeight: 1, background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent'}}>SU MISURA</div>
      <div style={{fontSize: 110, fontWeight: 900, color: K.text, letterSpacing: -4, lineHeight: 1.1}}>IN</div>
    </div>
    <div style={{marginTop: 30}}><Stopwatch sec={STOP_SEC} stopped label="TEMPO REALE" /></div>
    <div style={{marginTop: 70, display: 'flex', alignItems: 'center', gap: 24}}>
      <Img src={staticFile('logo.png')} style={{width: 110, height: 110, borderRadius: 28}} />
      <div style={{fontSize: 70, fontWeight: 900, color: K.text}}>PT Board</div>
    </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

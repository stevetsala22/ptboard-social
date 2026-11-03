import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {C, FONT, GRAD, SAFE_TOP, BEAT} from './theme';
import {CLIPS} from './clips';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ── Titolo in alto (sempre sotto i 250px di safe zone) ──
export const Headline: React.FC<{text: string; sub?: string; dark?: boolean; delay?: number}> = ({text, sub, dark, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 200}});
  const s2 = spring({frame: frame - delay - 20, fps, config: {damping: 13, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top: SAFE_TOP + 40, left: 60, right: 60, textAlign: 'center', fontFamily: FONT}}>
      <div
        style={{
          display: 'inline-block',
          padding: '16px 32px',
          borderRadius: 999,
          background: dark ? 'rgba(15,23,42,0.9)' : '#fff',
          color: dark ? '#fff' : C.strong,
          boxShadow: '0 12px 40px rgba(15,23,42,0.18)',
          fontWeight: 800,
          fontSize: 52,
          letterSpacing: -0.5,
          transform: `translateY(${interpolate(s, [0, 1], [-40, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
          opacity: s,
        }}
      >
        {text}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 18,
            display: 'inline-block',
            padding: '12px 26px',
            borderRadius: 999,
            background: GRAD,
            color: '#fff',
            fontWeight: 800,
            fontSize: 40,
            opacity: s2,
            transform: `scale(${interpolate(s2, [0, 1], [0.8, 1])})`,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

// ── HOOK 1: orologio 22:59 → 23:00, notte, batteria scarica ──
export const HookClock: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flip = frame >= 12;
  const pop = spring({frame: frame - 12, fps, config: {damping: 9, stiffness: 260}});
  const zoom = interpolate(frame, [0, 45], [1, 1.12]);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #1e293b 0%, #0b1120 70%)', fontFamily: FONT}}>
      <ExcelGrid opacity={0.12} dark />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${zoom})`}}>
        <div style={{fontSize: 70, fontWeight: 700, color: '#94a3b8', letterSpacing: 6, marginBottom: 10}}>MARTEDÌ</div>
        <div
          style={{
            fontSize: 300,
            fontWeight: 900,
            color: flip ? '#fff' : '#cbd5e1',
            letterSpacing: -10,
            fontVariantNumeric: 'tabular-nums',
            transform: `scale(${flip ? interpolate(pop, [0, 1], [1.25, 1]) : 1})`,
            textShadow: flip ? '0 0 60px rgba(96,165,250,0.55)' : 'none',
          }}
        >
          {flip ? '23:00' : '22:59'}
        </div>
        <Battery pct={flip ? 3 : 4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Battery: React.FC<{pct: number}> = ({pct}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 30, color: C.red, fontSize: 54, fontWeight: 800}}>
    <svg width="110" height="56" viewBox="0 0 110 56">
      <rect x="3" y="3" width="94" height="50" rx="10" fill="none" stroke="#ef4444" strokeWidth="6" />
      <rect x="100" y="18" width="8" height="20" rx="3" fill="#ef4444" />
      <rect x="11" y="11" width="10" height="34" rx="4" fill="#ef4444" />
    </svg>
    {pct}%
  </div>
);

// Griglia stile foglio di calcolo che si riempie
export const ExcelGrid: React.FC<{opacity?: number; dark?: boolean; fill?: number}> = ({opacity = 1, dark, fill = 0}) => {
  const frame = useCurrentFrame();
  const cols = 6;
  const rows = 22;
  const cw = 1080 / cols;
  const rh = 1920 / rows;
  const line = dark ? '#334155' : '#cbd5e1';
  const cells: React.ReactNode[] = [];
  const shown = Math.floor(frame * fill);
  for (let r = 1; r < rows; r++)
    for (let c = 1; c < cols; c++) {
      const i = (r - 1) * (cols - 1) + (c - 1);
      if (i < shown)
        cells.push(
          <text key={i} x={c * cw + 14} y={r * rh + rh * 0.68} fontSize={34} fill={dark ? '#64748b' : '#475569'} fontFamily="DM Sans">
            {['3x10', '4x8', '90"', '60%', 'Squat', 'Panca', '12', 'RPE 8', '2\'', 'Stacco'][(i * 7) % 10]}
          </text>
        );
    }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity}}>
      <rect x={0} y={0} width={1080} height={rh} fill={dark ? '#14532d' : '#107c41'} />
      {Array.from({length: cols - 1}, (_, c) => (
        <text key={c} x={(c + 1) * cw + cw / 2 - 12} y={rh * 0.68} fontSize={34} fontWeight={700} fill="#fff" fontFamily="DM Sans">
          {String.fromCharCode(65 + c)}
        </text>
      ))}
      {Array.from({length: rows}, (_, r) => (
        <line key={'h' + r} x1={0} x2={1080} y1={r * rh} y2={r * rh} stroke={line} strokeWidth={2} />
      ))}
      {Array.from({length: cols}, (_, c) => (
        <line key={'v' + c} y1={0} y2={1920} x1={c * cw} x2={c * cw} stroke={line} strokeWidth={2} />
      ))}
      {cells}
    </svg>
  );
};

// ── HOOK 2: "ANCORA SU EXCEL?" su foglio di calcolo che si riempie ──
export const HookExcel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame, fps, config: {damping: 11, stiffness: 240}});
  const b = spring({frame: frame - 8, fps, config: {damping: 11, stiffness: 240}});
  const zoom = interpolate(frame, [0, 45], [1.0, 1.15]);
  const shake = frame < 10 ? Math.sin(frame * 2.2) * (10 - frame) : 0;
  return (
    <AbsoluteFill style={{background: '#f8fafc', fontFamily: FONT}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <ExcelGrid opacity={0.9} fill={2.4} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: "rgba(15,23,42,0.72)"}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `translateX(${shake}px)`}}>
        <div style={{fontSize: 130, fontWeight: 900, color: '#fff', letterSpacing: -3, transform: `scale(${a})`, lineHeight: 1}}>ANCORA SU</div>
        <div
          style={{
            marginTop: 20,
            fontSize: 210,
            fontWeight: 900,
            letterSpacing: -6,
            lineHeight: 1,
            color: '#fff',
            background: '#107c41',
            padding: '10px 40px 26px',
            borderRadius: 30,
            transform: `scale(${interpolate(b, [0, 1], [1.6, 1])}) rotate(${interpolate(b, [0, 1], [-8, -2])}deg)`,
            opacity: b,
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}
        >
          EXCEL?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Icone SVG semplici ──
const Icon: React.FC<{kind: string; color: string}> = ({kind, color}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      {kind === 'clip' && (<><rect x="20" y="16" width="56" height="70" rx="8" {...p} /><rect x="34" y="8" width="28" height="16" rx="5" {...p} /><path d="M32 46h32M32 60h22" {...p} /></>)}
      {kind === 'watch' && (<><circle cx="48" cy="54" r="30" {...p} /><path d="M48 54V38M40 12h16M48 12v12" {...p} /></>)}
      {kind === 'list' && (<><path d="M36 26h40M36 48h40M36 70h40" {...p} /><circle cx="20" cy="26" r="4" fill={color} /><circle cx="20" cy="48" r="4" fill={color} /><circle cx="20" cy="70" r="4" fill={color} /></>)}
      {kind === 'pdf' && (<><path d="M24 10h34l18 18v58H24z" {...p} /><path d="M58 10v18h18" {...p} /><text x="50" y="72" textAnchor="middle" fontSize="22" fontWeight="900" fill={color} fontFamily="DM Sans">PDF</text></>)}
      {kind === 'chat' && (<><path d="M14 20h68v44H40L24 80V64H14z" {...p} /></>)}
      {kind === 'calc' && (<><rect x="16" y="12" width="64" height="72" rx="8" {...p} /><path d="M16 36h64M40 36v48M16 60h64" {...p} /></>)}
    </svg>
  );
};

const STACK = [
  {label: 'Anamnesi', icon: 'clip', color: C.blue},
  {label: 'Test', icon: 'watch', color: C.cyan},
  {label: 'Schede', icon: 'list', color: C.purple},
  {label: 'PDF', icon: 'pdf', color: C.red},
  {label: 'Messaggi', icon: 'chat', color: C.green},
  {label: 'Fogli Excel', icon: 'calc', color: '#107c41'},
];

// ── PROBLEMA 1: elenco che si accumula ──
export const ProblemStack: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(59,130,246,.10), transparent 60%)'}} />
      {STACK.map((it, i) => {
        // primi 4 in tempo con la voce, gli ultimi 2 "di troppo" a ritmo doppio
        const at = i < 4 ? 6 + i * BEAT * 1.2 : 6 + 4 * BEAT * 1.2 + (i - 4) * (BEAT / 2);
        const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 180}});
        const rot = [-4, 3, -2, 5, -6, 4][i];
        const y = SAFE_TOP + 70 + i * 150;
        // la pila si stringe e si inclina quando diventa troppa
        const squash = interpolate(frame, [70, 90], [0, 1], clamp);
        return (
          <div
            key={it.label}
            style={{
              position: 'absolute',
              left: 110 + (i % 2) * 40,
              top: y - squash * i * 40,
              width: 820,
              height: 140,
              borderRadius: 32,
              background: '#fff',
              border: `4px solid ${it.color}`,
              boxShadow: '0 20px 50px rgba(15,23,42,0.14)',
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              padding: '0 36px',
              transform: `translateY(${interpolate(s, [0, 1], [-900, 0])}px) rotate(${rot * (1 + squash)}deg)`,
              opacity: s > 0.01 ? 1 : 0,
            }}
          >
            <Icon kind={it.icon} color={it.color} />
            <div style={{fontSize: 74, fontWeight: 900, color: C.strong, letterSpacing: -1}}>{it.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── PROBLEMA 2: ORE PERSE ogni settimana ──
export const ProblemHours: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 10, stiffness: 220}});
  const hand = interpolate(frame, [0, 60], [0, 1440], {easing: Easing.out(Easing.cubic)});
  const days = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
  return (
    <AbsoluteFill style={{background: C.strong, fontFamily: FONT, alignItems: 'center'}}>
      <svg width="420" height="420" viewBox="0 0 420 420" style={{marginTop: SAFE_TOP + 40, transform: `scale(${s})`}}>
        <circle cx="210" cy="210" r="190" fill="none" stroke="#ef4444" strokeWidth="18" />
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1="210" y1="38" x2="210" y2="62" stroke="#fca5a5" strokeWidth="8" transform={`rotate(${i * 30} 210 210)`} />
        ))}
        <line x1="210" y1="210" x2="210" y2="70" stroke="#fff" strokeWidth="14" strokeLinecap="round" transform={`rotate(${hand} 210 210)`} />
        <line x1="210" y1="210" x2="210" y2="120" stroke="#fff" strokeWidth="18" strokeLinecap="round" transform={`rotate(${hand / 12} 210 210)`} />
        <circle cx="210" cy="210" r="16" fill="#ef4444" />
      </svg>
      <div style={{marginTop: 40, fontSize: 200, fontWeight: 900, color: '#fff', letterSpacing: -6, lineHeight: 0.95, textAlign: 'center', transform: `scale(${interpolate(s, [0, 1], [1.4, 1])})`}}>
        ORE<br />
        <span style={{color: '#ef4444'}}>PERSE</span>
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 40}}>
        {days.map((d, i) => {
          const on = frame > 18 + i * 4;
          return (
            <div key={d} style={{width: 112, padding: '14px 0', borderRadius: 18, textAlign: 'center', fontSize: 30, fontWeight: 800, color: on ? '#fff' : '#475569', background: on ? '#dc2626' : '#1e293b'}}>
              {d}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Registrazione reale dell'app dentro un telefono, con zoom e tap evidenziati ──
export const AppClip: React.FC<{id: string; bg?: string}> = ({id, bg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const clip = CLIPS[id];
  const z = clip.zoom;
  const kf = z.map((k) => k.f);
  const s = interpolate(frame, kf, z.map((k) => k.s), {...clamp, easing: Easing.inOut(Easing.cubic)});
  const fx = interpolate(frame, kf, z.map((k) => k.x), {...clamp, easing: Easing.inOut(Easing.cubic)});
  const fy = interpolate(frame, kf, z.map((k) => k.y), {...clamp, easing: Easing.inOut(Easing.cubic)});
  const PW = 860; // larghezza schermo telefono in px video
  const k = PW / 390;
  const PH = 844 * k;
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 160}});
  return (
    <AbsoluteFill style={{background: bg || `radial-gradient(circle at 50% 30%, #dbeafe, #f8fafc 60%)`, fontFamily: FONT, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: (1080 - PW) / 2,
          top: 260,
          width: PW,
          height: PH,
          borderRadius: 70,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 0 0 18px #0f172a, 0 40px 120px rgba(15,23,42,0.35)',
          transformOrigin: `${fx * k}px ${fy * k}px`,
          transform: `scale(${s * interpolate(enter, [0, 1], [0.92, 1])})`,
        }}
      >
        {clip.src ? (
          <OffthreadVideo src={staticFile(clip.src)} startFrom={Math.round((clip.startSec || 0) * fps)} muted style={{width: PW, height: PH, objectFit: 'cover'}} />
        ) : (
          <div style={{width: PW, height: PH, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'repeating-linear-gradient(45deg,#f1f5f9 0 30px,#e2e8f0 30px 60px)', color: C.muted, fontSize: 44, fontWeight: 800, textAlign: 'center', padding: 60}}>
            REGISTRAZIONE APP
            <div style={{fontSize: 60, color: C.strong, marginTop: 20}}>{clip.title}</div>
            <div style={{fontSize: 32, marginTop: 20}}>(segnaposto: manca accesso a personaltrainerboard.com)</div>
          </div>
        )}
        {clip.taps.map((t, i) => {
          const d = frame - t.f;
          if (d < 0 || d > 20) return null;
          const r = interpolate(d, [0, 20], [20, 110]);
          return (
            <div key={i} style={{position: 'absolute', left: t.x * k - r, top: t.y * k - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `8px solid ${C.blue}`, background: 'rgba(37,99,235,0.18)', opacity: interpolate(d, [0, 20], [1, 0])}} />
          );
        })}
        {clip.taps.map((t, i) => {
          const d = frame - t.f;
          if (d < -8 || d > 10) return null;
          return <div key={'f' + i} style={{position: 'absolute', left: t.x * k - 34, top: t.y * k - 34, width: 68, height: 68, borderRadius: '50%', background: 'rgba(15,23,42,0.35)', border: '5px solid #fff', transform: `scale(${d < 0 ? 1 : 0.85})`}} />;
        })}
      </div>
      <Headline text={clip.title} sub={clip.sub} delay={2} dark />
    </AbsoluteFill>
  );
};

// ── CTA ──
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = spring({frame, fps, config: {damping: 9, stiffness: 200}});
  const t1 = spring({frame: frame - 8, fps, config: {damping: 12, stiffness: 200}});
  const t2 = spring({frame: frame - 22, fps, config: {damping: 12, stiffness: 200}});
  const t3 = spring({frame: frame - 34, fps, config: {damping: 12, stiffness: 200}});
  const pulse = 1 + 0.04 * Math.sin((frame / BEAT) * Math.PI * 2);
  return (
    <AbsoluteFill style={{background: '#fff', fontFamily: FONT, alignItems: 'center'}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 35%, rgba(59,130,246,.16) 0%, rgba(139,92,246,.08) 40%, transparent 70%)'}} />
      <Img src={staticFile('logo.png')} style={{marginTop: SAFE_TOP + 60, width: 300, height: 300, borderRadius: 70, boxShadow: '0 30px 80px rgba(37,99,235,0.35)', transform: `scale(${logo}) rotate(${interpolate(logo, [0, 1], [-20, 0])}deg)`}} />
      <div style={{marginTop: 50, fontSize: 150, fontWeight: 900, letterSpacing: -5, background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent', transform: `scale(${t1})`}}>PT Board</div>
      <div style={{marginTop: 30, padding: '30px 70px', borderRadius: 999, background: C.blue, color: '#fff', fontSize: 70, fontWeight: 900, boxShadow: '0 16px 50px rgba(59,130,246,.45)', transform: `scale(${t2 * (frame > 40 ? pulse : 1)})`}}>
        Provalo gratis
      </div>
      <div style={{marginTop: 40, fontSize: 52, fontWeight: 700, color: C.strong, opacity: t3, transform: `translateY(${interpolate(t3, [0, 1], [30, 0])}px)`}}>personaltrainerboard.com</div>
    </AbsoluteFill>
  );
};

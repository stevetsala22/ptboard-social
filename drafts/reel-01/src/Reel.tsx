import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {SCENES} from './timeline';
import {Captions, SafeZone} from './Captions';
import {AppClip, Cta, ExcelGrid, HookClock, HookExcel, ProblemHours, ProblemStack} from './Scenes';
import {C, FONT, GRAD} from './theme';

const render = (id: string) => {
  switch (id) {
    case 'hook-clock': return <HookClock />;
    case 'hook-excel': return <HookExcel />;
    case 'problem-stack': return <ProblemStack />;
    case 'problem-hours': return <ProblemHours />;
    case 'cta': return <Cta />;
    case 'client-timer':
    case 'client-log': return <AppClip id={id} bg={`radial-gradient(circle at 50% 30%, #1e3a5f, ${C.navy} 65%)`} />;
    default: return <AppClip id={id} />;
  }
};

// Ingresso rapido su ogni taglio: punch-in + flash
const Cut: React.FC<{children: React.ReactNode; first?: boolean}> = ({children, first}) => {
  const f = useCurrentFrame();
  const scale = first ? 1 : interpolate(f, [0, 6], [1.12, 1], {extrapolateRight: 'clamp'});
  const blur = first ? 0 : interpolate(f, [0, 5], [12, 0], {extrapolateRight: 'clamp'});
  const flash = first ? 0 : interpolate(f, [0, 4], [0.55, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, filter: `blur(${blur}px)`}}>
      {children}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

const CoverFrame: React.FC = () => (
  <AbsoluteFill style={{background: '#f8fafc', fontFamily: FONT, alignItems: 'center', justifyContent: 'center'}}>
    <ExcelGrid opacity={0.5} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(15,23,42,.55), rgba(15,23,42,.88))'}} />
    <div style={{position: 'relative', textAlign: 'center', color: '#fff'}}>
      <div style={{fontSize: 120, fontWeight: 900, color: '#94a3b8', letterSpacing: -2}}>23:00.</div>
      <div style={{fontSize: 130, fontWeight: 900, letterSpacing: -4, lineHeight: 1}}>ANCORA SU</div>
      <div style={{display: 'inline-block', marginTop: 16, fontSize: 190, fontWeight: 900, letterSpacing: -6, background: '#107c41', padding: '0 40px 18px', borderRadius: 30, transform: 'rotate(-2deg)'}}>EXCEL?</div>
      <div style={{marginTop: 70, fontSize: 64, fontWeight: 800, lineHeight: 1.15}}>
        La scheda ora<br />
        <span style={{background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent', filter: 'brightness(1.6)'}}>si crea da sola</span>
      </div>
      <div style={{marginTop: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <Img src={staticFile('logo.png')} style={{width: 90, height: 90, borderRadius: 22}} />
        <div style={{fontSize: 56, fontWeight: 900}}>PT Board</div>
      </div>
    </div>
  </AbsoluteFill>
);

export const Reel: React.FC<{showSafe?: boolean; cover?: boolean}> = ({showSafe, cover}) => {
  if (cover) return <CoverFrame />;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {SCENES.map((s, i) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from}>
          <Cut first={i === 0}>{render(s.id)}</Cut>
        </Sequence>
      ))}
      <Captions />
      {showSafe && <SafeZone />}
    </AbsoluteFill>
  );
};

import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, delayRender, continueRender} from 'remotion';
import React, {useEffect, useState} from 'react';
import {LINES} from './timeline';
import {C, FONT, H, SAFE_BOTTOM} from './theme';

export type Word = {w: string; from: number; to: number};

// Parole evidenziate con il gradiente brand
const KEY = /^(excel|ore|perse|pt|board|minuti|sola|nsca|acsm|pdf|timer|storico|gratis)/i;

// Stima parola per parola proporzionale alla lunghezza (fallback senza allineamento TTS)
const estimate = (): Word[] => {
  const out: Word[] = [];
  for (const l of LINES) {
    const words = l.text.split(/\s+/);
    const weights = words.map((w) => w.length + 2 + (/[.,:?…]$/.test(w) ? 4 : 0));
    const tot = weights.reduce((a, b) => a + b, 0);
    let t = l.from;
    words.forEach((w, i) => {
      const d = ((l.to - l.from) * weights[i]) / tot;
      out.push({w, from: Math.round(t), to: Math.round(t + d)});
      t += d;
    });
  }
  return out;
};

// Gruppi da max 3 parole, spezzati sulla punteggiatura
const chunk = (words: Word[]): Word[][] => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === 3 || /[.,:?…]$/.test(w.w)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [words, setWords] = useState<Word[]>(estimate());
  const [handle] = useState(() => delayRender('alignment'));

  useEffect(() => {
    fetch(staticFile('audio/alignment.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && Array.isArray(j.words) && setWords(j.words))
      .catch(() => {})
      .finally(() => continueRender(handle));
  }, [handle]);

  const groups = chunk(words);
  const g = groups.find((gr, i) => {
    const end = groups[i + 1] ? Math.min(groups[i + 1][0].from, gr[gr.length - 1].to + 8) : gr[gr.length - 1].to + 8;
    return frame >= gr[0].from && frame < end;
  });
  if (!g) return null;

  const enter = spring({frame: frame - g[0].from, fps, config: {damping: 14, stiffness: 220}});

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          // poggia sul limite della safe zone inferiore
          marginBottom: SAFE_BOTTOM + 40,
          maxWidth: 940,
          padding: '22px 34px',
          borderRadius: 30,
          background: 'rgba(15,23,42,0.92)',
          boxShadow: '0 18px 50px rgba(15,23,42,0.35)',
          transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])}) translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
          opacity: enter,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          lineHeight: 1.12,
          letterSpacing: -1,
          color: '#fff',
          textAlign: 'center',
        }}
      >
        {g.map((w, i) => {
          const active = frame >= w.from;
          const pop = spring({frame: frame - w.from, fps, config: {damping: 10, stiffness: 300}});
          const key = KEY.test(w.w.replace(/[^\p{L}]/gu, ''));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '0 14px',
                opacity: active ? 1 : 0.35,
                transform: `scale(${active ? interpolate(pop, [0, 1], [1.15, 1]) : 1})`,
                ...(key && active
                  ? {background: 'linear-gradient(135deg,#60a5fa,#22d3ee,#a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent'}
                  : {}),
              }}
            >
              {w.w.toUpperCase()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const SafeZone: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 250, background: 'rgba(255,0,0,0.25)'}} />
    <div style={{position: 'absolute', top: H - 400, left: 0, right: 0, height: 400, background: 'rgba(255,0,0,0.25)'}} />
  </AbsoluteFill>
);

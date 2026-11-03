// Colori e font presi da landing.html di PT Board (:root + gradiente brand)
export const C = {
  bg: '#ffffff',
  strong: '#0f172a',
  text: '#374151',
  muted: '#6b7280',
  border: '#e5e7eb',
  blue: '#2563eb',
  cyan: '#0891b2',
  purple: '#7c3aed',
  red: '#dc2626',
  green: '#059669',
  yellow: '#d97706',
  navy: '#042C53', // share.html (vista cliente)
};
export const GRAD = `linear-gradient(135deg, ${C.blue}, ${C.cyan}, ${C.purple})`;
export const FONT = "'DM Sans', system-ui, sans-serif";

export const FPS = 30;
// Griglia di beat provvisoria a 120 BPM (1 beat = 15 frame). Si riallinea al BPM reale del brano.
export const BPM = 120;
export const BEAT = (60 / BPM) * FPS;

// Safe zone Instagram Reels: niente testo nei 250px in alto e nei 400px in basso.
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 400;
export const W = 1080;
export const H = 1920;

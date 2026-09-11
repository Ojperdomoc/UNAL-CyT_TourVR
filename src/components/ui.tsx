import { useEffect, useRef, useState } from 'react';
import {
  Compass as CompassIcon, Play, Glasses, Map as MapIcon,
  Flag, Check, X, Trophy, RotateCcw, Home, ChevronRight, Footprints, Timer,
  Move3d, Eye, Sparkles, Navigation, Navigation2, Hand, Zap, Award, Camera, Info, Footprints as StepsIcon,
} from 'lucide-react';
import type { CheckpointDef, Snapshot } from '../game/Engine';
import { CHECKPOINTS } from '../game/Engine';

export const CAMPUS_IMG = '/images/campus.jpg';

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  const d = Math.floor((ms % 1000) / 100);
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}.${d}`;
}

export function headingDeg(yaw: number) {
  return ((-yaw * 180) / Math.PI % 360 + 360) % 360;
}

/* ================= MENÚ PRINCIPAL ================= */
export function Menu({ onStart }: { onStart: (mode: 'flat' | 'vr') => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* fondo foto */}
      <div className="absolute inset-0">
        <img src={CAMPUS_IMG} alt="Edificio del campus" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/55 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.55)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* insignia */}
        <div className="mb-5 flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold tracking-[0.22em] text-cyan-200 backdrop-blur">
          <Glasses className="h-4 w-4" />
          EXPERIENCIA VR · EXPLORACIÓN 360°
        </div>

        <h1 className="text-center text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
          CAMPUS <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">VR</span>
        </h1>
        <p className="mt-3 text-center text-lg font-medium text-slate-200 sm:text-xl">
          Misión Patrimonio — Del aula al cielo en <span className="font-bold text-amber-300">6 checkpoints</span>
        </p>
        <p className="mt-2 max-w-2xl text-center text-sm leading-relaxed text-slate-300/90 sm:text-base">
          Explora libremente en todas las direcciones una recreación 3D del edificio de tu fotografía.
          Encuentra cada baliza, responde su reto y cruza el arco dorado de la meta.
        </p>

        {/* botones */}
        <div className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onStart('flat')}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-4 text-base font-bold text-slate-950 shadow-[0_10px_40px_-8px_rgba(34,211,238,0.7)] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
          >
            <Play className="h-5 w-5 transition group-hover:translate-x-0.5" />
            Jugar en pantalla
          </button>
          <button
            onClick={() => onStart('vr')}
            className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-violet-300/40 bg-violet-500/20 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:scale-[1.02] hover:bg-violet-500/30 active:scale-[0.99]"
          >
            <Glasses className="h-5 w-5" />
            Modo VR Cardboard
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Pantalla: WASD + ratón · Móvil: joystick + arrastre · VR: gira la cabeza + botón caminar
        </p>

        {/* tarjetas */}
        <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300"><Move3d className="h-5 w-5" /></div>
            <h3 className="font-bold">Exploración total 360°</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">Camina por la explanada, cruza los pilotis y rodea el edificio. Sin rieles: tú eliges la ruta.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300"><Flag className="h-5 w-5" /></div>
            <h3 className="font-bold">6 checkpoints + quiz</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">Cada baliza esconde un dato de arquitectura y una pregunta. Acierta para sumar puntos extra.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/20 text-violet-300"><Eye className="h-5 w-5" /></div>
            <h3 className="font-bold">VR estereoscópico</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">Activa la vista doble con giroscopio y usa unas gafas Cardboard para sumergirte en el campus.</p>
          </div>
        </div>

        {/* ruta */}
        <div className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/50 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-300">
            <MapIcon className="h-4 w-4 text-cyan-300" /> RUTA DE LA MISIÓN
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {CHECKPOINTS.map((c, i) => (
              <div key={c.id} className="flex shrink-0 items-center gap-1">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-slate-950"
                    style={{ background: `#${c.color.toString(16).padStart(6, '0')}` }}
                  >
                    {c.isFinish ? <Flag className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap text-xs font-semibold">{c.short}</span>
                </div>
                {i < CHECKPOINTS.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <Camera className="h-3.5 w-3.5" />
            Recreación 3D interactiva basada en tu fotografía del campus — la verás en las vallas del recorrido.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= BRÚJULA ================= */
export function Compass({ yaw }: { yaw: number }) {
  const h = headingDeg(yaw);
  const marks = [
    { label: 'N', deg: 0 }, { label: 'NE', deg: 45 }, { label: 'E', deg: 90 }, { label: 'SE', deg: 135 },
    { label: 'S', deg: 180 }, { label: 'SO', deg: 225 }, { label: 'O', deg: 270 }, { label: 'NO', deg: 315 },
  ];
  const pxPerDeg = 2.4;
  return (
    <div className="pointer-events-none relative h-12 w-56 overflow-hidden rounded-xl border border-white/15 bg-slate-950/60 backdrop-blur sm:w-64">
      <div className="absolute inset-x-0 top-1 z-10 flex justify-center">
        <div className="h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-amber-300" />
      </div>
      <div className="absolute inset-0" style={{ transform: `translateX(${-h * pxPerDeg + 112}px)` }}>
        {[-360, 0, 360].flatMap((off) =>
          marks.map((m) => {
            const x = (m.deg + off) * pxPerDeg;
            const main = m.label.length === 1;
            return (
              <div key={`${off}-${m.label}`} className="absolute top-0 flex h-full w-10 -translate-x-1/2 flex-col items-center justify-center" style={{ left: x }}>
                <span className={`text-sm font-black ${m.label === 'N' ? 'text-red-400' : main ? 'text-white' : 'text-slate-400'} ${main ? '' : 'text-[10px]'}`}>
                  {m.label}
                </span>
                <span className="text-[9px] font-medium tabular-nums text-slate-400">{(m.deg + off + 360) % 360}°</span>
              </div>
            );
          })
        )}
      </div>
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent" />
    </div>
  );
}

/* ================= MINIMAPA ================= */
export function Minimap({ snap, done, current }: { snap: Snapshot; done: boolean[]; current: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) return;
    const S = cv.width;
    const toMap = (x: number, z: number): [number, number] => [
      ((x + 105) / 210) * S,
      ((z + 105) / 210) * S,
    ];
    // fondo
    g.fillStyle = 'rgba(8,15,28,0.85)';
    g.fillRect(0, 0, S, S);
    // pasto
    g.fillStyle = 'rgba(74,140,60,0.5)';
    const grass: [number, number, number, number][] = [[-91, -50, 26, 120], [68, -45, 20, 90], [-80, 55, 120, 14]];
    grass.forEach(([x, z, w, d]) => {
      const [mx, mz] = toMap(x, z);
      g.fillRect(mx, mz, (w / 210) * S, (d / 210) * S);
    });
    // edificios
    g.fillStyle = 'rgba(226,232,240,0.9)';
    let [bx, bz] = toMap(-38, -42);
    g.fillRect(bx, bz, (116 / 210) * S, (14 / 210) * S);
    [bx, bz] = toMap(-54, -28);
    g.fillRect(bx, bz, (18 / 210) * S, (46 / 210) * S);
    // línea al objetivo
    const target = CHECKPOINTS[current];
    if (target) {
      const [px, pz] = toMap(snap.x, snap.z);
      const [tx, tz] = toMap(target.pos[0], target.pos[1]);
      g.strokeStyle = 'rgba(34,211,238,0.5)';
      g.setLineDash([4, 4]);
      g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(px, pz); g.lineTo(tx, tz); g.stroke();
      g.setLineDash([]);
    }
    // checkpoints
    CHECKPOINTS.forEach((c, i) => {
      const [mx, mz] = toMap(c.pos[0], c.pos[1]);
      const col = `#${c.color.toString(16).padStart(6, '0')}`;
      if (i === current && !done[i]) {
        g.strokeStyle = col;
        g.lineWidth = 2;
        const r = 7 + Math.sin(performance.now() / 280) * 2;
        g.beginPath(); g.arc(mx, mz, r, 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = done[i] ? '#22c55e' : i === current ? col : 'rgba(148,163,184,0.6)';
      g.beginPath(); g.arc(mx, mz, c.isFinish ? 5.5 : 4.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0f172a';
      g.font = 'bold 7px system-ui';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(c.isFinish ? '★' : `${i + 1}`, mx, mz + 0.5);
    });
    // jugador
    const [px, pz] = toMap(snap.x, snap.z);
    g.save();
    g.translate(px, pz);
    g.rotate(-snap.yaw);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#0ea5e9';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.4); g.lineTo(-5, 5);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
    // norte
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.font = 'bold 9px system-ui';
    g.textAlign = 'left';
    g.fillText('N ↑', 6, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
  return (
    <canvas
      ref={ref}
      width={168}
      height={168}
      className="h-36 w-36 rounded-2xl border border-white/15 shadow-xl sm:h-42 sm:w-42"
      style={{ width: 150, height: 150 }}
    />
  );
}

/* ================= FLECHA OBJETIVO ================= */
export function TargetArrow({ snap }: { snap: Snapshot }) {
  const cp = CHECKPOINTS[snap.current];
  if (!cp) return null;
  const col = `#${cp.color.toString(16).padStart(6, '0')}`;
  return (
    <div className="pointer-events-none flex flex-col items-center gap-1">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-slate-950/60 backdrop-blur"
        style={{ borderColor: col, boxShadow: `0 0 24px ${col}66` }}
      >
        <Navigation2
          className="h-7 w-7 transition-transform duration-150"
          style={{ color: col, transform: `rotate(${-snap.angleToTarget}rad)` }}
        />
      </div>
      <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-center backdrop-blur">
        <div className="text-[11px] font-bold leading-tight" style={{ color: col }}>
          {snap.current + 1}/{CHECKPOINTS.length} · {cp.name}
        </div>
        <div className="text-[11px] font-semibold tabular-nums text-white">{snap.dist.toFixed(0)} m</div>
      </div>
    </div>
  );
}

/* ================= QUIZ DE CHECKPOINT ================= */
export function QuizCard({
  cp, index, onContinue,
}: {
  cp: CheckpointDef; index: number; onContinue: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked === cp.answer;
  const col = `#${cp.color.toString(16).padStart(6, '0')}`;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl">
        <div className="relative h-36">
          <img src={CAMPUS_IMG} alt="Campus" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black text-slate-950" style={{ background: col }}>
            {cp.isFinish ? <Flag className="h-3.5 w-3.5" /> : <MapIcon className="h-3.5 w-3.5" />}
            CHECKPOINT {index + 1}/{CHECKPOINTS.length}
          </div>
          <h2 className="absolute bottom-2 left-4 right-4 text-2xl font-black leading-tight">{cp.name}</h2>
        </div>
        <div className="space-y-4 p-5">
          {picked === null ? (
            <>
              <p className="text-sm font-semibold text-slate-200">{cp.question}</p>
              <div className="space-y-2">
                {cp.options.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => setPicked(i)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {op}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${ok ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-red-400/40 bg-red-400/10'}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-emerald-400 text-slate-950' : 'bg-red-400 text-slate-950'}`}>
                  {ok ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </div>
                <div>
                  <div className={`font-black ${ok ? 'text-emerald-300' : 'text-red-300'}`}>
                    {ok ? (cp.isFinish ? '¡Meta desbloqueada!' : '¡Correcto! +150 pts') : 'Casi… +50 pts'}
                  </div>
                  {!ok && <div className="text-xs text-slate-300">Respuesta: <b>{cp.options[cp.answer]}</b></div>}
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Sparkles className="h-5 w-5 shrink-0 text-amber-300" />
                <p className="text-xs leading-relaxed text-slate-300"><b className="text-white">Dato de arquitectura:</b> {cp.fact}</p>
              </div>
              <button
                onClick={() => onContinue(ok)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-slate-950 transition hover:brightness-110"
                style={{ background: col }}
              >
                {cp.isFinish ? 'Cruzar la meta' : 'Continuar la misión'}
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= VICTORIA ================= */
export function Victory({
  timeMs, score, correct, onRestart, onMenu,
}: {
  timeMs: number; score: number; correct: number; onRestart: () => void; onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/30 bg-slate-900/95 shadow-[0_0_80px_-10px_rgba(245,158,11,0.5)]">
        <div className="relative h-44">
          <img src={CAMPUS_IMG} alt="Campus" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
          <div className="absolute inset-x-0 -bottom-1 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-xl">
              <Trophy className="h-8 w-8 text-slate-950" />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6 pt-10 text-center">
          <div className="text-xs font-bold tracking-[0.25em] text-amber-300">MISIÓN COMPLETADA</div>
          <h2 className="text-4xl font-black">¡Llegaste a la meta!</h2>
          <p className="text-sm text-slate-300">Recorriste el campus en todas las direcciones y dominaste sus 6 checkpoints.</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <Timer className="mx-auto h-5 w-5 text-cyan-300" />
              <div className="mt-1 text-lg font-black tabular-nums">{formatTime(timeMs)}</div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400">TIEMPO</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <Zap className="mx-auto h-5 w-5 text-amber-300" />
              <div className="mt-1 text-lg font-black tabular-nums">{score}</div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400">PUNTOS</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <Award className="mx-auto h-5 w-5 text-emerald-300" />
              <div className="mt-1 text-lg font-black tabular-nums">{correct}/{CHECKPOINTS.length}</div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400">ACIERTOS</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={onRestart} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3.5 font-bold text-slate-950 transition hover:brightness-110">
              <RotateCcw className="h-5 w-5" /> Jugar de nuevo
            </button>
            <button onClick={onMenu} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold transition hover:bg-white/10">
              <Home className="h-5 w-5" /> Menú principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= AYUDA ================= */
export function HelpModal({ onClose, isTouch }: { onClose: () => void; isTouch: boolean }) {
  const rows = isTouch
    ? [
        { icon: <Hand className="h-5 w-5" />, t: 'Joystick izquierdo', d: 'Empuja para caminar en esa dirección. Llévalo al borde para correr.' },
        { icon: <Eye className="h-5 w-5" />, t: 'Arrastra lado derecho', d: 'Desliza para mirar en 360°: arriba, abajo y a los lados.' },
        { icon: <Navigation className="h-5 w-5" />, t: 'Flecha guía', d: 'La brújula superior y la flecha apuntan al siguiente checkpoint con su distancia.' },
        { icon: <Glasses className="h-5 w-5" />, t: 'Modo VR', d: 'Pulsa el icono VR, permite el giroscopio e inserta el móvil en tus Cardboard. Mantén CAMINAR para avanzar.' },
      ]
    : [
        { icon: <Footprints className="h-5 w-5" />, t: 'WASD / Flechas', d: 'Muévete por la explanada. Mantén Shift para correr.' },
        { icon: <Eye className="h-5 w-5" />, t: 'Ratón (clic para capturar)', d: 'Mira libremente en todas las direcciones. Pulsa Esc para liberar el cursor.' },
        { icon: <Navigation className="h-5 w-5" />, t: 'Flecha guía', d: 'La brújula y la flecha dorada apuntan al siguiente checkpoint con su distancia.' },
        { icon: <Glasses className="h-5 w-5" />, t: 'Modo VR', d: 'Vista estereoscópica lado a lado lista para Cardboard u otros visores con móvil.' },
      ];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Info className="h-5 w-5 text-cyan-300" /> Cómo jugar</h2>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">{r.icon}</div>
              <div><div className="text-sm font-bold">{r.t}</div><div className="text-xs leading-relaxed text-slate-300">{r.d}</div></div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:brightness-110">
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}

/* ================= JOYSTICK MÓVIL ================= */
export function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  useEffect(() => {
    const el = base.current;
    if (!el) return;
    const R = 52;
    const setFromEvent = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      let dx = clientX - (rect.left + rect.width / 2);
      let dy = clientY - (rect.top + rect.height / 2);
      const l = Math.hypot(dx, dy);
      if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
      setKnob({ x: dx, y: dy });
      onMove(dx / R, dy / R);
    };
    const down = (e: PointerEvent) => {
      active.current = e.pointerId;
      el.setPointerCapture(e.pointerId);
      setFromEvent(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      if (active.current !== e.pointerId) return;
      setFromEvent(e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => {
      if (active.current !== e.pointerId) return;
      active.current = null;
      setKnob({ x: 0, y: 0 });
      onMove(0, 0);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={base} className="pointer-events-auto relative h-32 w-32 touch-none rounded-full border border-white/20 bg-slate-950/40 backdrop-blur" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Footprints className="h-6 w-6 text-white/25" />
      </div>
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-cyan-200/50 bg-cyan-400/70 shadow-[0_0_24px_rgba(34,211,238,0.6)]"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

/* ================= BARRA DE PROGRESO ================= */
export function ProgressBar({ done, current }: { done: boolean[]; current: number }) {
  const total = CHECKPOINTS.length;
  const n = done.filter(Boolean).length;
  return (
    <div className="pointer-events-none w-full max-w-md">
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-200">
        <span className="flex items-center gap-1"><Flag className="h-3.5 w-3.5 text-amber-300" /> PROGRESO {n}/{total}</span>
        <span className="tabular-nums">{Math.round((n / total) * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        {CHECKPOINTS.map((c, i) => {
          const col = `#${c.color.toString(16).padStart(6, '0')}`;
          const isDone = done[i];
          const isNext = i === current && !isDone;
          return (
            <div key={c.id} className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: isDone ? '100%' : isNext ? '45%' : '0%',
                  background: isDone ? '#22c55e' : col,
                  boxShadow: isNext ? `0 0 12px ${col}` : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {CHECKPOINTS.map((c, i) => (
          <div key={c.id} className="flex flex-1 items-center justify-center gap-0.5 text-[9px] font-bold text-slate-300">
            {done[i] ? <Check className="h-3 w-3 text-emerald-400" /> : <span className="tabular-nums opacity-70">{i + 1}</span>}
            <span className="hidden truncate sm:inline">{c.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= ICONOS HUD ================= */
export { CompassIcon, StepsIcon };

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2, VolumeX, Pause, Play, Glasses, Monitor, CircleHelp as HelpIcon,
  Timer as TimerIcon, Zap, MousePointerClick, Footprints, Flag, ChevronUp, ChevronDown, X, RotateCcw, Home,
} from 'lucide-react';
import { Engine, CHECKPOINTS, type Snapshot } from './game/Engine';
import { gameAudio } from './game/audio';
import {
  Menu, Compass, Minimap, TargetArrow, QuizCard, Victory, HelpModal, Joystick, ProgressBar, formatTime,
} from './components/ui';

const DEFAULT_SNAP: Snapshot = {
  x: 0, z: 46, yaw: 0, pitch: 0, speed: 0, moving: false, current: 0, dist: 16, angleToTarget: 0,
};

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [pendingMode, setPendingMode] = useState<'flat' | 'vr'>('flat');
  const [snap, setSnap] = useState<Snapshot>(DEFAULT_SNAP);
  const [done, setDone] = useState<boolean[]>(CHECKPOINTS.map(() => false));
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [quiz, setQuiz] = useState<number | null>(null);
  const [victory, setVictory] = useState(false);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [vrMode, setVrMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hintOpen, setHintOpen] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const lastSnapRef = useRef(0);
  const stateRef = useRef({ quiz, victory, paused, help });
  stateRef.current = { quiz, victory, paused, help };

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    []
  );

  /* ---------- ciclo de vida del motor ---------- */
  useEffect(() => {
    if (screen !== 'game') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, {
      onCheckpoint: (idx) => {
        const s = stateRef.current;
        if (s.quiz !== null || s.victory || s.paused) return;
        if (engine.done[idx]) return;
        gameAudio.checkpoint();
        setQuiz(idx);
        engine.setPaused(true);
        engine.exitLock();
      },
      onUpdate: (sn) => {
        const now = performance.now();
        if (now - lastSnapRef.current > 70) {
          lastSnapRef.current = now;
          setSnap({ ...sn });
        }
      },
    });
    engineRef.current = engine;
    if (pendingMode === 'vr') {
      engine.setVR(true);
      setVrMode(true);
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        void engine.enableGyro();
      }
    }
    engine.start();
    gameAudio.startAmbient();

    const onLock = () => setLocked(document.pointerLockElement === canvas);
    document.addEventListener('pointerlockchange', onLock);

    return () => {
      document.removeEventListener('pointerlockchange', onLock);
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  /* ---------- cronómetro ---------- */
  useEffect(() => {
    if (screen !== 'game' || paused || quiz !== null || victory || help) return;
    const id = window.setInterval(() => setTimeMs((t) => t + 100), 100);
    return () => window.clearInterval(id);
  }, [screen, paused, quiz, victory, help]);

  /* ---------- pausa del motor según estado ---------- */
  useEffect(() => {
    engineRef.current?.setPaused(paused || quiz !== null || help || victory);
  }, [paused, quiz, help, victory]);

  /* ---------- atajos ---------- */
  useEffect(() => {
    if (screen !== 'game') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') toggleMute();
      if (e.code === 'KeyH') setHelp((h) => !h);
      if (e.code === 'KeyV') toggleVR();
      if (e.code === 'KeyP' && quiz === null && !victory) setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, quiz, victory, vrMode, muted]);

  const startGame = useCallback((mode: 'flat' | 'vr') => {
    gameAudio.click();
    setPendingMode(mode);
    setDone(CHECKPOINTS.map(() => false));
    setScore(0);
    setCorrect(0);
    setTimeMs(0);
    setQuiz(null);
    setVictory(false);
    setPaused(false);
    setHelp(false);
    setVrMode(false);
    setSnap(DEFAULT_SNAP);
    setScreen('game');
    gameAudio.go();
    if (!('ontouchstart' in window) && mode === 'flat') {
      setTimeout(() => setHelp(true), 600);
    }
  }, []);

  const restart = useCallback(() => {
    gameAudio.click();
    const e = engineRef.current;
    e?.reset();
    setDone(CHECKPOINTS.map(() => false));
    setScore(0);
    setCorrect(0);
    setTimeMs(0);
    setQuiz(null);
    setVictory(false);
    setPaused(false);
  }, []);

  const toMenu = useCallback(() => {
    gameAudio.click();
    gameAudio.stopAmbient();
    setScreen('menu');
    setVrMode(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      gameAudio.setMuted(!m);
      return !m;
    });
  }, []);

  const toggleVR = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    gameAudio.click();
    setVrMode((v) => {
      const nv = !v;
      e.setVR(nv);
      if (nv && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) void e.enableGyro();
      if (!nv) e.disableGyro();
      return nv;
    });
  }, []);

  const handleQuizContinue = useCallback((ok: boolean) => {
    const e = engineRef.current;
    if (e == null || quiz === null) return;
    gameAudio.click();
    const cp = CHECKPOINTS[quiz];
    setScore((s) => s + (ok ? 150 : 50));
    if (ok) setCorrect((c) => c + 1);
    e.completeCurrent();
    setDone([...e.done]);
    setQuiz(null);
    e.setPaused(false);
    if (cp.isFinish) {
      const bonus = Math.max(0, Math.round(600 - timeMs / 1000));
      setScore((s) => s + bonus);
      setVictory(true);
      e.celebrate();
      gameAudio.victory();
      e.exitLock();
    } else if (!isTouch && !vrMode) {
      e.requestLock();
    }
  }, [quiz, timeMs, isTouch, vrMode]);

  const current = CHECKPOINTS[snap.current];
  const currentColor = current ? `#${current.color.toString(16).padStart(6, '0')}` : '#22d3ee';

  /* ---------- look táctil (arrastrar lado derecho) ---------- */
  const lookRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (lookRef.current) return;
    const t = e.changedTouches[0];
    lookRef.current = { id: t.identifier, x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const L = lookRef.current;
    if (!L) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === L.id) {
        const dx = t.clientX - L.x;
        const dy = t.clientY - L.y;
        L.x = t.clientX; L.y = t.clientY;
        engineRef.current?.addLook(-dx * 2.4, -dy * 2.4);
        break;
      }
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const L = lookRef.current;
    if (!L) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === L.id) lookRef.current = null;
    }
  };
  // fallback ratón-arrastrar cuando no hay pointer-lock
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  if (screen === 'menu') return <Menu onStart={startGame} />;

  return (
    <div ref={wrapRef} className="relative h-screen w-screen select-none overflow-hidden bg-slate-950 text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onClick={() => {
          if (!isTouch && !vrMode && quiz === null && !victory && !paused) engineRef.current?.requestLock();
        }}
        onMouseDown={(e) => { if (!locked) dragRef.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={(e) => {
          const d = dragRef.current;
          if (d && !locked && !paused && quiz === null) {
            engineRef.current?.addLook((e.clientX - d.x) * 1.6, (e.clientY - d.y) * 1.6);
            dragRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseUp={() => { dragRef.current = null; }}
      />

      {/* capa táctil de mirada */}
      {isTouch && (
        <div
          className="absolute bottom-0 right-0 top-0 w-[62%] touch-none"
          style={{ touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        />
      )}

      {/* overlay VR */}
      {vrMode && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-black/80" />
          <div className="absolute inset-0 flex">
            <div className="h-full flex-1" style={{ background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.95) 100%)' }} />
            <div className="h-full flex-1" style={{ background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.95) 100%)' }} />
          </div>
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-violet-300/40 bg-slate-950/80 px-4 py-1.5 text-[11px] font-bold tracking-widest text-violet-200">
            MODO VR · GIRA LA CABEZA PARA MIRAR 360°
          </div>
        </div>
      )}

      {/* punto de mira */}
      {!vrMode && quiz === null && !victory && !paused && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          <div className="absolute -inset-2 rounded-full border border-white/30" />
        </div>
      )}

      {/* ===== HUD superior ===== */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          {!vrMode && <Compass yaw={snap.yaw} />}
          <ProgressBar done={done} current={snap.current} />
        </div>

        {!vrMode && (
          <div className="hidden md:block"><TargetArrow snap={snap} /></div>
        )}

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 backdrop-blur">
              <TimerIcon className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-black tabular-nums">{formatTime(timeMs)}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 backdrop-blur">
              <Zap className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-black tabular-nums">{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <HudBtn onClick={toggleMute} title="Silenciar (M)" active={muted}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </HudBtn>
            <HudBtn onClick={toggleVR} title="Modo VR (V)" active={vrMode}>
              {vrMode ? <Monitor className="h-4 w-4" /> : <Glasses className="h-4 w-4" />}
            </HudBtn>
            <HudBtn onClick={() => setHelp(true)} title="Ayuda (H)">
              <HelpIcon className="h-4 w-4" />
            </HudBtn>
            <HudBtn onClick={() => setPaused(true)} title="Pausa (P)">
              <Pause className="h-4 w-4" />
            </HudBtn>
          </div>
          {!vrMode && (
            <div className="hidden sm:block"><Minimap snap={snap} done={done} current={snap.current} /></div>
          )}
        </div>
      </div>

      {/* flecha móvil compacta */}
      {!vrMode && (
        <div className="absolute left-3 top-32 z-20 md:hidden">
          <TargetArrow snap={snap} />
        </div>
      )}
      {vrMode && (
        <div className="absolute left-1/2 top-14 z-20 -translate-x-1/2 rounded-full border bg-slate-950/80 px-4 py-1.5 text-xs font-bold backdrop-blur" style={{ borderColor: currentColor, color: currentColor }}>
          {current ? `${snap.current + 1}/${CHECKPOINTS.length} · ${current.name} · ${snap.dist.toFixed(0)} m` : ''}
        </div>
      )}

      {/* aviso captura ratón */}
      {!isTouch && !locked && !vrMode && quiz === null && !victory && !paused && (
        <button
          onClick={() => engineRef.current?.requestLock()}
          className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-16 items-center gap-2 rounded-2xl border border-cyan-300/40 bg-slate-950/80 px-5 py-3 text-sm font-bold text-cyan-200 backdrop-blur transition hover:bg-slate-900"
        >
          <MousePointerClick className="h-5 w-5" />
          Clic para capturar el ratón y mirar 360°
        </button>
      )}

      {/* ===== HUD inferior ===== */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          {isTouch && !victory && quiz === null && (
            <Joystick onMove={(x, y) => engineRef.current?.setJoystick(x, y)} />
          )}
          {!isTouch && !vrMode && (
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-[11px] font-semibold text-slate-300 backdrop-blur sm:flex">
              <Footprints className="h-4 w-4 text-cyan-300" />
              WASD moverse · Shift correr · Ratón mirar · {locked ? 'ESC liberar' : 'clic capturar'}
              {snap.speed > 8.5 && <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-amber-300">CORRIENDO</span>}
            </div>
          )}
        </div>

        {/* pista actual */}
        {!vrMode && quiz === null && !victory && current && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 hidden w-full max-w-md -translate-x-1/2 md:block" style={{ bottom: isTouch ? 12 : 12 }}>
            <div className="rounded-2xl border bg-slate-950/70 backdrop-blur" style={{ borderColor: `${currentColor}55` }}>
              <button
                onClick={() => setHintOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs font-bold"
                style={{ color: currentColor }}
              >
                <span className="flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  OBJETIVO {snap.current + 1}: {current.name.toUpperCase()}
                </span>
                {hintOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              {hintOpen && <p className="px-4 pb-3 text-xs leading-relaxed text-slate-200">{current.hint}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-col items-end gap-2">
          {vrMode && (
            <button
              className="pointer-events-auto flex h-24 w-24 touch-none items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-400/25 text-sm font-black text-cyan-100 backdrop-blur active:bg-cyan-400/50"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => { e.preventDefault(); engineRef.current?.setVRWalk(true); }}
              onPointerUp={() => engineRef.current?.setVRWalk(false)}
              onPointerLeave={() => engineRef.current?.setVRWalk(false)}
              onPointerCancel={() => engineRef.current?.setVRWalk(false)}
            >
              CAMINAR
            </button>
          )}
          {isTouch && !vrMode && (
            <div className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-[10px] font-semibold text-slate-300 backdrop-blur">
              Arrastra a la derecha para mirar
            </div>
          )}
        </div>
      </div>

      {/* pista móvil */}
      {!vrMode && quiz === null && !victory && current && (
        <div className="absolute inset-x-3 bottom-40 z-20 md:hidden">
          <div className="rounded-xl border bg-slate-950/70 px-3 py-2 backdrop-blur" style={{ borderColor: `${currentColor}55` }}>
            <div className="text-[10px] font-bold" style={{ color: currentColor }}>
              {snap.current + 1}/{CHECKPOINTS.length} · {current.name} · {snap.dist.toFixed(0)} m
            </div>
            <div className="truncate text-[11px] text-slate-200">{current.hint}</div>
          </div>
        </div>
      )}

      {/* ===== overlays ===== */}
      {quiz !== null && !victory && (
        <QuizCard cp={CHECKPOINTS[quiz]} index={quiz} onContinue={handleQuizContinue} />
      )}
      {victory && (
        <Victory timeMs={timeMs} score={score} correct={correct} onRestart={restart} onMenu={toMenu} />
      )}
      {help && <HelpModal onClose={() => setHelp(false)} isTouch={isTouch} />}
      {paused && !victory && quiz === null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
              <Pause className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black">Pausa</h2>
            <p className="mt-1 text-sm text-slate-400">Checkpoint {snap.current + 1} de {CHECKPOINTS.length} · {formatTime(timeMs)}</p>
            <div className="mt-5 space-y-2">
              <button onClick={() => setPaused(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:brightness-110">
                <Play className="h-5 w-5" /> Continuar
              </button>
              <div className="flex gap-2">
                <button onClick={restart} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold transition hover:bg-white/10">
                  <RotateCcw className="h-4 w-4" /> Reiniciar
                </button>
                <button onClick={toMenu} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold transition hover:bg-white/10">
                  <Home className="h-4 w-4" /> Menú
                </button>
              </div>
              <button onClick={() => { setPaused(false); engineRef.current?.exitLock(); }} className="mx-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HudBtn({
  children, onClick, title, active,
}: {
  children: React.ReactNode; onClick: () => void; title: string; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur transition active:scale-95 ${
        active
          ? 'border-cyan-300/60 bg-cyan-400/25 text-cyan-200'
          : 'border-white/15 bg-slate-950/60 text-slate-200 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

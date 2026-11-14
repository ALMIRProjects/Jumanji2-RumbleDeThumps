import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Heart, Magnet, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import GameOverPanel from '@/components/GameOverPanel';
import { CHARACTERS, WORLD_HEIGHT, WORLD_WIDTH, type CharacterId } from '@/game/config';
import { drawWorld } from '@/game/render';
import { createWorld, stepWorld, type FrameInput, type WorldEvent, type WorldState } from '@/game/world';

type Phase = 'menu' | 'select' | 'options' | 'running' | 'over';

interface RunnerGameProps {
  onScoreSaved: () => void;
}

interface PointerState {
  id: number;
  startX: number;
  startY: number;
  active: boolean;
}

interface FinalStats {
  score: number;
  rings: number;
  distance: number;
}

const initialInput: FrameInput = { jumpPressed: false, duck: false, steering: null, steerDirection: 0 };

function eventTone(event: WorldEvent | 'click') {
  if (event === 'ring') return { frequency: 740, duration: 0.07, type: 'sine' as OscillatorType };
  if (event === 'powerup' || event === 'shield') return { frequency: 430, duration: 0.18, type: 'triangle' as OscillatorType };
  if (event === 'hit') return { frequency: 110, duration: 0.32, type: 'sawtooth' as OscillatorType };
  if (event === 'start') return { frequency: 280, duration: 0.12, type: 'triangle' as OscillatorType };
  return { frequency: 520, duration: 0.06, type: 'sine' as OscillatorType };
}

function playDrum(context: AudioContext, accent: boolean) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = accent ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(accent ? 92 : 66, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.16);
  gain.gain.setValueAtTime(accent ? 0.16 : 0.09, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  osc.connect(gain).connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.2);
}

export default function RunnerGame({ onScoreSaved }: RunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldState>(createWorld('bravestone'));
  const phaseRef = useRef<Phase>('menu');
  const inputRef = useRef<FrameInput>({ ...initialInput });
  const pointerRef = useRef<PointerState | null>(null);
  const soundOnRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const drumBeatRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('menu');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('bravestone');
  const [soundOn, setSoundOn] = useState(true);
  const [finalStats, setFinalStats] = useState<FinalStats>({ score: 0, rings: 0, distance: 0 });

  const changePhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const getAudioContext = useCallback(() => {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return null;
    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;
    if (context.state === 'suspended') void context.resume();
    return context;
  }, []);

  const playSound = useCallback((event: WorldEvent | 'click') => {
    if (!soundOnRef.current) return;
    const context = getAudioContext();
    if (!context) return;
    const tone = eventTone(event);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(tone.frequency * (event === 'hit' ? 0.5 : 1.35), context.currentTime + tone.duration);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(event === 'hit' ? 0.12 : 0.055, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + tone.duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + tone.duration + 0.02);
  }, [getAudioContext]);

  const startRun = useCallback(() => {
    worldRef.current = createWorld(selectedCharacter);
    inputRef.current = { ...initialInput };
    drumBeatRef.current = 0;
    changePhase('running');
    playSound('start');
  }, [changePhase, playSound, selectedCharacter]);

  const queueJump = useCallback(() => {
    if (phaseRef.current === 'running') inputRef.current.jumpPressed = true;
  }, []);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_WIDTH * dpr;
    canvas.height = WORLD_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let frameId = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (phaseRef.current === 'running') {
        const world = worldRef.current;
        stepWorld(world, dt, inputRef.current);
        inputRef.current.jumpPressed = false;
        for (const event of world.events.splice(0)) {
          playSound(event);
          if (event === 'hit') navigator.vibrate?.(80);
        }
        if (soundOnRef.current && !world.dead) {
          const interval = Math.max(0.24, 0.62 - world.speed * 0.3);
          drumBeatRef.current += dt;
          if (drumBeatRef.current >= interval) {
            drumBeatRef.current = 0;
            const context = getAudioContext();
            if (context) playDrum(context, world.time % 0.5 < 0.3);
          }
        }
        if (world.dead) {
          setFinalStats({ score: Math.floor(world.score), rings: world.ringCount, distance: world.distance });
          changePhase('over');
        }
      }
      drawWorld(ctx, worldRef.current);
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [changePhase, getAudioContext, playSound]);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); if (!event.repeat) queueJump(); }
      if (event.code === 'ArrowDown') { event.preventDefault(); inputRef.current.duck = true; }
      if (event.code === 'ArrowLeft') { event.preventDefault(); inputRef.current.steerDirection = -1; }
      if (event.code === 'ArrowRight') { event.preventDefault(); inputRef.current.steerDirection = 1; }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'ArrowDown') inputRef.current.duck = false;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') inputRef.current.steerDirection = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [queueJump]);

  const updatePointerSteering = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalized = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    inputRef.current.steering = Math.max(-1, Math.min(1, normalized));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'running') return;
    pointerRef.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, active: true };
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePointerSteering(event);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current?.active || pointerRef.current.id !== event.pointerId) return;
    updatePointerSteering(event);
    if (event.clientY - pointerRef.current.startY > 38) inputRef.current.duck = true;
    if (pointerRef.current.startY - event.clientY > 38) inputRef.current.jumpPressed = true;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current?.active || pointerRef.current.id !== event.pointerId) return;
    const pointer = pointerRef.current;
    if (Math.abs(event.clientX - pointer.startX) < 18 && Math.abs(event.clientY - pointer.startY) < 28) queueJump();
    pointerRef.current = null;
    inputRef.current.steering = null;
    inputRef.current.duck = false;
  };

  const selected = CHARACTERS[selectedCharacter];

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[26px] border-2 border-[#7a5c28] bg-[#1a1206] shadow-[0_30px_90px_rgba(0,0,0,0.5),inset_0_0_50px_rgba(0,0,0,0.55)]">
        <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="block h-auto w-full touch-none select-none" style={{ aspectRatio: `${WORLD_WIDTH} / ${WORLD_HEIGHT}` }} aria-label="Jumanji Run" role="img" />

        {phase === 'menu' && <div className="absolute inset-0 flex items-center justify-center bg-[#120c04]/72 p-5 backdrop-blur-[2px] sm:p-10"><div className="animate-rise-in w-full max-w-lg text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f5cd5c]/70 bg-gradient-to-b from-[#c9a23c] to-[#7a5c1c] shadow-[0_0_40px_rgba(245,205,92,0.3)] text-[#1c1308]"><span className="font-serif text-3xl font-black">J</span></div><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.4em] text-[#d4af37]">In the jungle, you must run</p><h2 className="mt-3 font-serif text-5xl font-black tracking-wide text-[#f0d68a] drop-shadow-[0_3px_18px_rgba(212,175,55,0.4)] sm:text-7xl">JUMANJI RUN</h2><p className="mx-auto mt-4 max-w-md font-serif text-sm italic leading-6 text-[#c9b98a] sm:text-base">A game for those who seek to find a way to leave their world behind.</p><button type="button" onClick={() => { changePhase('select'); playSound('click'); }} className="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-[#f5cd5c]/70 bg-gradient-to-b from-[#c9a23c] to-[#8a6a1c] px-8 py-4 font-serif text-sm font-black uppercase tracking-widest text-[#1c1308] shadow-[0_6px_24px_rgba(212,175,55,0.3)] transition hover:-translate-y-1 hover:shadow-[0_10px_34px_rgba(245,205,92,0.4)]"><Play className="h-5 w-5 fill-current" /> Choose your hero</button><p className="mt-5 text-xs font-semibold text-[#9a8a5c]">Swipe to steer · tap to jump · hold down to slide</p></div></div>}

        {phase === 'select' && <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-[#120c04]/92 p-4 backdrop-blur-sm sm:p-8"><div className="animate-rise-in w-full max-w-3xl"><div className="text-center"><p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#d4af37]">Chapter one</p><h2 className="mt-2 font-serif text-3xl font-black tracking-wide text-[#f0d68a] drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)] sm:text-4xl">Choose Your Explorer</h2><p className="mt-2 font-serif text-sm italic text-[#9a8a5c]">Each hero carries a gift of the jungle.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{Object.values(CHARACTERS).map((character) => <button key={character.id} type="button" onClick={() => { setSelectedCharacter(character.id); playSound('click'); }} className={`rounded-2xl border-2 p-4 text-left transition hover:-translate-y-1 ${selectedCharacter === character.id ? 'border-[#f5cd5c] bg-[#241a0a] shadow-[0_0_30px_rgba(245,205,92,0.2)]' : 'border-[#5e441c] bg-[#1a1206] hover:border-[#a8843c]'}`}><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#f5cd5c]/50 font-serif text-xl font-black text-[#1c1308]" style={{ backgroundColor: character.accent }}>{character.name[0]}</div>{selectedCharacter === character.id && <Check className="h-5 w-5 text-[#f5cd5c]" />}</div><p className="mt-4 font-serif text-lg font-black text-[#f5e6c8]">{character.name}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">{character.title}</p><p className="mt-3 min-h-[40px] font-serif text-xs italic leading-5 text-[#c9b98a]">{character.description}</p><div className="mt-4 rounded-xl border border-[#5e441c] bg-[#160f05] px-3 py-2 text-left"><p className="flex items-center gap-2 text-[11px] font-bold text-[#f5cd5c]">{character.lives > 1 ? <Heart className="h-3.5 w-3.5" /> : character.magnet ? <Magnet className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}{character.perk}</p></div></button>)}</div><div className="mt-6 flex justify-center"><button type="button" onClick={() => { changePhase('options'); playSound('click'); }} className="inline-flex items-center gap-2 rounded-full border-2 border-[#f5cd5c]/70 bg-gradient-to-b from-[#c9a23c] to-[#8a6a1c] px-7 py-3 font-serif text-sm font-black uppercase tracking-widest text-[#1c1308] transition hover:-translate-y-0.5 hover:shadow-[0_8px_26px_rgba(245,205,92,0.3)]">Prepare the expedition <ArrowRight className="h-4 w-4" /></button></div></div></div>}

        {phase === 'options' && <div className="absolute inset-0 flex items-center justify-center bg-[#120c04]/92 p-5 backdrop-blur-sm sm:p-8"><div className="animate-rise-in w-full max-w-md text-center"><p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#d4af37]">Chapter two</p><h2 className="mt-2 font-serif text-3xl font-black tracking-wide text-[#f0d68a] drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]">The drums are waiting, {selected.name.split(' ')[0]}.</h2><div className="mt-6 rounded-2xl border-2 border-[#7a5c28] bg-[#1a1206] p-5 text-left shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]"><div className="flex items-center justify-between"><div><p className="font-serif text-sm font-black text-[#f5e6c8]">Jungle drums</p><p className="mt-1 text-xs text-[#9a8a5c]">The beat quickens as you run</p></div><button type="button" aria-label={soundOn ? 'Mute audio' : 'Enable audio'} onClick={() => { setSoundOn((enabled) => !enabled); playSound('click'); }} className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${soundOn ? 'border-[#f5cd5c]/70 bg-gradient-to-b from-[#c9a23c] to-[#8a6a1c] text-[#1c1308]' : 'border-[#5e441c] bg-[#160f05] text-[#9a8a5c]'}`}>{soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button></div><div className="mt-5 border-t border-[#5e441c] pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Ancient controls</p><div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-[#c9b98a]"><span className="rounded-xl border border-[#5e441c] bg-[#160f05] px-2 py-3"><ArrowLeft className="mx-auto mb-1 h-4 w-4 text-[#d4af37]" /> Steer</span><span className="rounded-xl border border-[#5e441c] bg-[#160f05] px-2 py-3"><ArrowUp className="mx-auto mb-1 h-4 w-4 text-[#d4af37]" /> Jump</span><span className="rounded-xl border border-[#5e441c] bg-[#160f05] px-2 py-3"><ArrowDown className="mx-auto mb-1 h-4 w-4 text-[#d4af37]" /> Slide</span></div></div></div><button type="button" onClick={startRun} className="mt-7 inline-flex items-center gap-3 rounded-full border-2 border-[#f5cd5c]/70 bg-gradient-to-b from-[#c9a23c] to-[#8a6a1c] px-9 py-4 font-serif text-sm font-black uppercase tracking-widest text-[#1c1308] shadow-[0_6px_24px_rgba(212,175,55,0.3)] transition hover:-translate-y-1 hover:shadow-[0_10px_34px_rgba(245,205,92,0.4)]"><Play className="h-5 w-5 fill-current" /> Begin the run</button></div></div>}

        {phase === 'over' && <GameOverPanel score={finalStats.score} rings={finalStats.rings} distance={finalStats.distance} onPlayAgain={startRun} onSaved={onScoreSaved} />}
      </div>
      <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a8a5c] sm:text-xs"><span>Drag to drift between lanes</span><span className="hidden sm:inline">Arrow keys supported</span><span>Tap to leap</span></div>
    </div>
  );
}

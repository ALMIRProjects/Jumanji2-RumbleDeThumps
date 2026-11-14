import { useState, type FormEvent } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { submitHighScore } from '@/lib/highScores';

interface GameOverPanelProps {
  score: number;
  rings: number;
  distance: number;
  onPlayAgain: () => void;
  onSaved: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function GameOverPanel({ score, rings, distance, onPlayAgain, onSaved }: GameOverPanelProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const trimmedName = name.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || status === 'saving' || status === 'saved') return;
    setStatus('saving');
    try {
      await submitHighScore(trimmedName, score);
      setStatus('saved');
      onSaved();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto bg-[#120c04]/90 p-5 backdrop-blur-sm sm:p-8">
      <div className="animate-rise-in w-full max-w-[460px]">
        <div className="relative rounded-[26px] border-2 border-[#a8843c] bg-[#221708] p-6 text-center shadow-[0_0_60px_rgba(212,175,55,0.18),inset_0_0_40px_rgba(0,0,0,0.7)] sm:p-8">
          <div className="pointer-events-none absolute inset-[6px] rounded-[20px] border border-[#7a5c28]/60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#d4af37]">The jungle claims another</p>
          <h2 className="mt-3 font-serif text-3xl font-black tracking-wide text-[#f0d68a] drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)] sm:text-4xl">GAME OVER</h2>

          <div className="mt-6 rounded-2xl border border-[#7a5c28]/70 bg-[#160f05]/90 p-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#9a7c3c]">Final score</p>
            <p className="mt-1 font-serif text-6xl font-black tabular-nums text-[#f5cd5c] drop-shadow-[0_2px_14px_rgba(245,205,92,0.4)]">{score.toLocaleString()}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#5e441c] bg-[#1c1308] p-3"><p className="text-[9px] uppercase tracking-[0.2em] text-[#9a7c3c]">Distance</p><p className="mt-1 font-serif text-xl font-black text-[#f0d68a]">{Math.floor(distance)}m</p></div>
              <div className="rounded-xl border border-[#5e441c] bg-[#1c1308] p-3"><p className="text-[9px] uppercase tracking-[0.2em] text-[#9a7c3c]">Rings</p><p className="mt-1 font-serif text-xl font-black text-[#f5cd5c]">{rings}</p></div>
            </div>
          </div>

          {status === 'saved' ? (
            <div className="mt-5 rounded-xl border border-[#7a5c28] bg-[#1c1308] px-4 py-3 font-serif text-sm font-bold text-[#f0d68a]">Your name is carved on the totem board.</div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 text-left">
              <label htmlFor="player-name" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a7c3c]">Carve your name</label>
              <div className="flex gap-2">
                <input id="player-name" type="text" value={name} maxLength={16} autoComplete="off" placeholder="Explorer" onChange={(event) => { setName(event.target.value); if (status === 'error') setStatus('idle'); }} className="min-w-0 flex-1 rounded-xl border border-[#7a5c28] bg-[#160f05] px-4 py-3 font-serif text-sm font-semibold text-[#f5e6c8] outline-none transition placeholder:text-[#6b5426] focus:border-[#f5cd5c] focus:ring-2 focus:ring-[#f5cd5c]/20" />
                <button type="submit" disabled={!trimmedName || status === 'saving'} className="inline-flex items-center gap-2 rounded-xl border border-[#f5cd5c]/60 bg-gradient-to-b from-[#c9a23c] to-[#8a6a1c] px-4 py-3 font-serif text-sm font-black text-[#1c1308] shadow-[0_4px_14px_rgba(212,175,55,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{status === 'saving' ? 'Carving' : 'Carve'}</button>
              </div>
              {status === 'error' && <p role="alert" className="mt-2 text-xs font-semibold text-[#e08a6a]">The spirits refused the carving. Try again.</p>}
            </form>
          )}

          <button type="button" onClick={onPlayAgain} className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f5cd5c]/50 px-7 py-3 font-serif text-sm font-black uppercase tracking-wider text-[#f5cd5c] transition hover:-translate-y-0.5 hover:bg-[#f5cd5c]/10 hover:shadow-[0_8px_24px_rgba(245,205,92,0.2)]"><RotateCcw className="h-4 w-4" /> Play again</button>
        </div>
      </div>
    </div>
  );
}

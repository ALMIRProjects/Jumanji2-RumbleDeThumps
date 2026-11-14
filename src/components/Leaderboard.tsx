import { useEffect, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { fetchTopScores, type HighScore } from '@/lib/highScores';

interface LeaderboardProps {
  refreshKey: number;
}

type LoadStatus = 'loading' | 'ready' | 'error';

const RANK_STYLES = ['border-[#f5cd5c] bg-[#c9a23c] text-[#1c1308]', 'border-[#c0c0c0] bg-[#9aa0a0] text-[#1c1308]', 'border-[#cd7f32] bg-[#a8652a] text-[#1c1308]'];

export default function Leaderboard({ refreshKey }: LeaderboardProps) {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetchTopScores()
      .then((rows) => {
        if (!active) return;
        setScores(rows);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => { active = false; };
  }, [refreshKey, retryKey]);

  return (
    <section className="rounded-[24px] border-2 border-[#7a5c28] bg-[#1a1206] p-5 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#f5cd5c]/60 bg-gradient-to-b from-[#c9a23c] to-[#7a5c1c] text-[#1c1308]"><Trophy className="h-5 w-5" aria-hidden="true" /></div>
        <div><h2 className="font-serif text-lg font-black text-[#f0d68a]">Totem Board</h2><p className="text-xs text-[#9a8a5c]">The greatest explorers of the jungle</p></div>
      </div>
      <div className="mt-5">
        {status === 'loading' && <p className="py-8 text-center font-serif text-sm italic text-[#9a8a5c]">Consulting the spirits...</p>}
        {status === 'error' && <div className="py-7 text-center"><p className="font-serif text-sm italic text-[#e08a6a]">The board is shrouded in mist.</p><button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#a8843c] px-4 py-2 text-xs font-bold text-[#f0d68a] transition hover:bg-[#f5cd5c]/10"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div>}
        {status === 'ready' && scores.length === 0 && <p className="py-8 text-center font-serif text-sm italic leading-6 text-[#9a8a5c]">No names carved yet. Be the first legend of the jungle.</p>}
        {status === 'ready' && scores.length > 0 && <ol className="space-y-2">{scores.map((entry, index) => <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-[#5e441c]/70 bg-[#160f05]/80 px-3 py-2.5 transition hover:border-[#a8843c]"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-serif text-xs font-black ${RANK_STYLES[index] ?? 'border-[#5e441c] bg-[#241a0a] text-[#c9b98a]'}`}>{index + 1}</span><span className="min-w-0 flex-1 truncate font-serif text-sm font-semibold text-[#f5e6c8]">{entry.playerName}</span><span className="font-serif text-sm font-black tabular-nums text-[#f5cd5c]">{entry.score.toLocaleString()}</span></li>)}</ol>}
      </div>
    </section>
  );
}

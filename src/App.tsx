import { useState } from 'react';
import { Compass, Gem, Leaf, Volume2 } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import RunnerGame from '@/components/RunnerGame';

export default function App() {
  const [boardVersion, setBoardVersion] = useState(0);

  return (
    <div className="min-h-screen overflow-x-hidden text-[#f8f5e9]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffd166] text-[#10232d] shadow-[0_10px_30px_rgba(255,209,102,0.18)]">
            <Compass className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#ffd166]">Jumanji</p>
            <h1 className="text-lg font-black tracking-tight text-[#fff8e8] sm:text-xl">Run wild</h1>
          </div>
        </div>
        <div className="hidden items-center gap-5 text-xs font-semibold text-[#a4c9c0] sm:flex">
          <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-[#53d6c5]" /> Season one: untamed</span>
          <span className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-[#ffd166]" /> Sound on</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-7 px-4 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-12 lg:pb-14">
        <section className="min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff896e]">Expedition 02</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#fff8e8] sm:text-3xl">The jungle is moving.</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#28434b] bg-[#10232d]/70 px-3 py-2 text-xs font-bold text-[#a4c9c0] md:flex">
              <Gem className="h-4 w-4 text-[#ffd166]" /> Collect. Dodge. Repeat.
            </div>
          </div>
          <RunnerGame onScoreSaved={() => setBoardVersion((version) => version + 1)} />
        </section>
        <aside className="lg:pt-[76px]">
          <Leaderboard refreshKey={boardVersion} />
          <div className="mt-4 rounded-3xl border border-[#24434a] bg-[#0d202a]/80 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ffd166]">Field notes</p>
            <p className="mt-3 text-sm leading-6 text-[#a4c9c0]">Swipe anywhere on the track to drift between lanes. Tap to leap. Hold the bottom edge to slide under vines.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

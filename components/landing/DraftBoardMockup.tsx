import { BoltIcon } from "@/components/icons";

const MOCK_ROWS = [
  { tier: 1, name: "Ja'Marr Chase", team: "CIN", pos: "WR", adp: 2, proj: 330, drafted: false },
  { tier: 1, name: "Bijan Robinson", team: "ATL", pos: "RB", adp: 4, proj: 310, drafted: false },
  { tier: 1, name: "Justin Jefferson", team: "MIN", pos: "WR", adp: 3, proj: 320, drafted: true },
  { tier: 2, name: "Jahmyr Gibbs", team: "DET", pos: "RB", adp: 5, proj: 305, drafted: false },
  { tier: 2, name: "Puka Nacua", team: "LAR", pos: "WR", adp: 11, proj: 262, drafted: false },
  { tier: 3, name: "Malik Nabers", team: "NYG", pos: "WR", adp: 13, proj: 265, drafted: false },
];

const TIER_CLASSES: Record<number, string> = {
  1: "bg-amber-400/15 text-amber-300 ring-amber-400/40",
  2: "bg-sky-400/15 text-sky-300 ring-sky-400/40",
  3: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/40",
};

const POS_CLASSES: Record<string, string> = {
  WR: "text-emerald-300",
  RB: "text-sky-300",
  QB: "text-rose-300",
  TE: "text-violet-300",
};

export function DraftBoardMockup() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-3xl">
      {/* No ambient glow here anymore — BorderGlow frames the board and the
          hero already has an aura behind this column. (The -inset glow div
          used to overflow the frame and spawn scrollbars.) */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950/90 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9),0_0_40px_-12px_rgba(52,211,153,0.28)] backdrop-blur">
        {/* Mockup header bar */}
        <div className="flex items-center border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <BoltIcon size={16} />
            </span>
            <span className="font-display text-base tracking-wide text-zinc-100">DraftEdge</span>
            <span className="ml-2 text-xs font-medium text-zinc-500">The Office League · PPR</span>
          </div>
        </div>

        {/* Mockup table */}
        <div className="px-4 py-4">
          <div className="font-tech grid grid-cols-[52px_minmax(0,1fr)_72px_64px_72px] gap-2 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Tier</span>
            <span>Player</span>
            <span className="text-right">Pos</span>
            <span className="text-right">ADP</span>
            <span className="text-right">Proj</span>
          </div>
          <div className="space-y-1">
            {MOCK_ROWS.map((r) => (
              <div
                key={r.name}
                className={`grid grid-cols-[52px_minmax(0,1fr)_72px_64px_72px] items-center gap-2 rounded-lg border px-2 py-2 text-sm transition ${
                  r.drafted
                    ? "border-zinc-800 bg-zinc-900/40 opacity-45"
                    : `border-zinc-800 bg-zinc-900/70 ${TIER_CLASSES[r.tier].includes("amber") ? "border-amber-400/20" : TIER_CLASSES[r.tier].includes("sky") ? "border-sky-400/20" : "border-emerald-400/20"}`
                }`}
              >
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${TIER_CLASSES[r.tier]}`}
                >
                  T{r.tier}
                </span>
                <span className={`flex min-w-0 items-center gap-1.5 font-semibold ${r.drafted ? "line-through" : "text-zinc-100"}`}>
                  <span className="text-zinc-400">{r.name}</span>
                  <span className="rounded bg-zinc-800 px-1.5 text-[10px] font-bold text-zinc-400">{r.team}</span>
                  {r.drafted && <span className="text-[10px] font-bold uppercase text-rose-400/80">Drafted</span>}
                </span>
                <span className={`text-right font-bold ${POS_CLASSES[r.pos]}`}>{r.pos}</span>
                <span className="font-tech text-right text-zinc-400">{r.adp}</span>
                <span className="font-tech text-right font-semibold text-zinc-200">{r.proj}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

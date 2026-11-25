import type { TradeGrade } from "@/lib/trade-value";

export function TradeVerdictSummary({ grade, count, aValue, bValue }: {
  grade: TradeGrade; count: number; aValue: number; bValue: number;
}) {
  const net = aValue - bValue;
  const total = aValue + bValue;
  const aPct = total > 0 ? (aValue / total) * 100 : 50;
  return (
    <>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <span className={`font-display text-5xl font-bold ${grade.text}`}>{grade.letter}</span>
          <div>
            <p className={`font-display text-xl tracking-wide ${grade.text}`}>{grade.label}</p>
            <p className="text-sm text-zinc-400">
              {count} players compared
            </p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Net value</p>
          <p className={`font-tech text-2xl font-bold ${net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {`${net >= 0 ? "+" : ""}${net.toFixed(1)}`}
          </p>
        </div>
      </div>

      {/* Value split bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <span className="text-emerald-300">Receive</span>
          <span className="text-rose-300">Give up</span>
        </div>
        <div data-value-meter className="mt-1.5 flex h-2.5 overflow-hidden rounded-full">
          <div className="bg-emerald-500" style={{ width: `${aPct}%` }} />
          <div className="bg-rose-500" style={{ width: `${100 - aPct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-tech">{`${aValue.toFixed(1)} value`}</span>
          <span className="font-tech">{`${bValue.toFixed(1)} value`}</span>
        </div>
      </div>
    </>
  );
}

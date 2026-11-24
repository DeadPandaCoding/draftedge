export function LeagueSummary({ name, scoring, tePremium, platform, teams }: {
  name: string; scoring: string; tePremium?: boolean; platform: string; teams: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="truncate font-semibold text-zinc-100">{name}</p>
      <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
        {scoring}{tePremium ? " · TEP" : ""}
      </span>
      <span className="font-mono text-[10px] uppercase text-zinc-500">{platform}</span>
      <span className="font-mono text-[10px] text-zinc-500">{teams} teams</span>
    </div>
  );
}

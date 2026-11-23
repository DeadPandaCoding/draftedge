import AppShell from "@/components/dashboard/AppShell";

export function ToolLoadingState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-wide text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>
      </header>
      <p className="text-sm text-zinc-500" role="status" aria-busy="true">
        Loading tool…
      </p>
    </AppShell>
  );
}

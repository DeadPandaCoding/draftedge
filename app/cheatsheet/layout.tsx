import { toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata(
  "Fantasy Football Cheat Sheets",
  "Build a fantasy football draft cheat sheet with player rankings, tiers, projections, ADP, and synced league settings.",
  "/cheatsheet",
);

export default function CheatSheetLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

import { toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata(
  "Fantasy Football Trade Analyzer",
  "Compare fantasy football trade packages by player value, rest-of-season projections, roster fit, and matchup context.",
  "/trade",
);

export default function TradeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

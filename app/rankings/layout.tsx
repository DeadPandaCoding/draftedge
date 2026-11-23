import { toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata(
  "Fantasy Football Player Rankings",
  "Compare fantasy football player rankings, projections, position tiers, and ADP across PPR, Half-PPR, and Standard scoring.",
  "/rankings",
);

export default function RankingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

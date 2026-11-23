import { toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata(
  "Fantasy Football Start/Sit Optimizer",
  "Compare fantasy football players for your weekly lineup using projections, health, matchups, and roster context.",
  "/start-sit",
);

export default function StartSitLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

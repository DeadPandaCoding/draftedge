import { toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata(
  "Fantasy Football Mock Draft Simulator",
  "Practice fantasy football drafts with configurable league settings, roster slots, draft strategy, and position-aware picks.",
  "/mock",
);

export default function MockDraftLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

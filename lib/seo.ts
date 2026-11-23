import type { Metadata } from "next";

const BASE_URL = "https://draftedge.vercel.app";

export function toolMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = `${title} | DraftEdge`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: new URL(path, BASE_URL),
      siteName: "DraftEdge",
      title: fullTitle,
      description,
    },
    twitter: { card: "summary", title: fullTitle, description },
  };
}

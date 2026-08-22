"use client";

import { useState } from "react";
import { CopyIcon, LinkIcon, RedditIcon, TwitterIcon } from "@/components/icons";

/** Open the X (Twitter) compose dialog pre-filled with text + URL. */
export function shareOnTwitter(text: string, url: string) {
  const target = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;
  window.open(target, "_blank", "noopener,noreferrer");
}

/** Open Reddit's submit dialog pre-filled with a title + URL. */
export function shareOnReddit(title: string, url: string) {
  const target = `https://www.reddit.com/submit?url=${encodeURIComponent(
    url
  )}&title=${encodeURIComponent(title)}`;
  window.open(target, "_blank", "noopener,noreferrer");
}

/**
 * A compact share row: X, Reddit, and copy-link. Kept generic so any tool
 * (trade results, poll, draft board) can drop it in with a URL + message.
 */
export function ShareButtons({
  url,
  text,
  title,
}: {
  url: string;
  text: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the URL is still in the address bar.
    }
  };

  const btn =
    "glass glass-hover flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:text-white";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => shareOnTwitter(text, url)} aria-label="Share on X" className={btn}>
        <TwitterIcon size={15} />
      </button>
      <button
        type="button"
        onClick={() => shareOnReddit(title, url)}
        aria-label="Share on Reddit"
        className={btn}
      >
        <RedditIcon size={15} />
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="glass glass-hover flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-300 transition hover:text-white"
      >
        {copied ? <CopyIcon size={14} /> : <LinkIcon size={14} />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

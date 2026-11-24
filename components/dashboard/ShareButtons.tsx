"use client";

import { useId, useState } from "react";
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
 *
 * If the clipboard API is unavailable (or permission is denied), a read-only
 * input with the full URL appears so it can still be selected and copied.
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
  const [copyFailed, setCopyFailed] = useState(false);
  const fallbackId = useId();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const btn =
    "glass glass-hover flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:text-white";

  return (
    <div className="flex flex-col items-end gap-1.5">
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

      {copyFailed && (
        <div className="w-full max-w-[22rem]">
          <label
            htmlFor={fallbackId}
            className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-amber-300/90"
          >
            Clipboard unavailable · copy manually
          </label>
          <input
            id={fallbackId}
            readOnly
            value={url}
            aria-label="Share URL"
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
            className="w-full rounded-lg border border-amber-500/30 bg-[#080E0C] px-2.5 py-1.5 font-mono text-[11px] text-zinc-200 outline-none transition focus:border-amber-400/60"
          />
        </div>
      )}
    </div>
  );
}

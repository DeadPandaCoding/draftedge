"use client";

import { useState, type FormEvent } from "react";
import { SendIcon } from "@/components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    // TODO: send to a newsletter provider (e.g. Buttondown, Resend, Mailchimp).
    setSubscribed(true);
  }

  if (subscribed) {
    return (
      <p className="mt-4 text-sm font-medium text-emerald-300" role="status">
        Thanks for subscribing — you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <div className="flex items-center gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          placeholder="Enter your email"
          maxLength={254}
          aria-invalid={Boolean(error)}
          className="glass-input w-full rounded-full px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
        />
        <button
          type="submit"
          aria-label="Subscribe to newsletter"
          className="btn-glass-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <SendIcon size={16} />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </form>
  );
}

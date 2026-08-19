"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 rounded-lg")}>
      <h1 className="text-2xl font-bold mb-2">Component Example</h1>
      <h2 className="text-xl font-semibold">{count}</h2>
      <div className="flex gap-2">
        <button onClick={() => setCount((prev) => prev - 1)}>-</button>
        <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      </div>
    </div>
  );
};

export type AuthMode = "signin" | "signup";

export interface AuthSwitchProps {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
  className?: string;
}

/**
 * Sign In ⇄ Sign Up mode switcher, used by the authentication page.
 * Controlled: the parent owns the mode and renders the matching form.
 */
export const AuthSwitch = ({ mode, onChange, className }: AuthSwitchProps) => {
  const options: { value: AuthMode; label: string }[] = [
    { value: "signin", label: "Sign In" },
    { value: "signup", label: "Sign Up" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className={cn("grid grid-cols-2 gap-1 rounded-xl bg-zinc-800/70 p-1", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={mode === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg py-2 text-sm font-semibold transition",
            mode === o.value
              ? "bg-zinc-700 text-white shadow"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

export default AuthSwitch;

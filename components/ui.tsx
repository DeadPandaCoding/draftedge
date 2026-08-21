"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { Position } from "@/lib/types";
import { POSITION_STYLES, TIER_STYLES } from "@/lib/tiers";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import BorderGlow, { GLOW_PRESET } from "@/components/ui/BorderGlow";

export function TierBadge({ tier, size = "sm" }: { tier: number; size?: "sm" | "xs" }) {
  const s = TIER_STYLES[tier] ?? TIER_STYLES[5];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ring-1 ring-inset ${s.pill} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-px text-[10px]"
      }`}
      title={s.label}
    >
      T{tier}
    </span>
  );
}

export function PosBadge({ position, size = "sm" }: { position: Position; size?: "sm" | "xs" }) {
  const s = POSITION_STYLES[position];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset ${s.pill} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-px text-[10px]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {position}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Dialog semantics: Escape to close, focus moves into the dialog on open and
  // returns to the trigger on close. (A full focus trap is intentionally not
  // implemented — the dialog only contains action buttons, so Tab order stays
  // short and visible.)
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <BorderGlow
        {...GLOW_PRESET}
        className={`relative z-10 w-full ${width}`}
        borderRadius={20}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className="p-6 outline-none"
        >
          <h3 className="mb-4 text-lg font-bold text-zinc-100">{title}</h3>
          {children}
        </div>
      </BorderGlow>
    </div>
  );
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  width = "w-56",
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  // Inject the toggle directly onto the trigger element so the trigger stays
  // a real, keyboard-accessible button (no interactive wrapper div).
  const triggerEl = React.isValidElement(trigger)
    ? React.cloneElement(
        trigger as React.ReactElement<{
          onClick?: () => void;
          "aria-expanded"?: boolean;
          "aria-haspopup"?: string;
        }>,
        {
          onClick: () => setOpen((o) => !o),
          "aria-expanded": open,
          "aria-haspopup": "menu",
        },
      )
    : trigger;

  return (
    <div className="relative" ref={ref}>
      {triggerEl}
      {open && (
        <BorderGlow
          {...GLOW_PRESET}
          className={`absolute z-40 mt-2 ${width} ${align === "right" ? "right-0" : "left-0"}`}
          borderRadius={12}
          glowRadius={28}
        >
          <div className="overflow-hidden rounded-xl">{children(() => setOpen(false))}</div>
        </BorderGlow>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
        danger
          ? "text-rose-400 hover:bg-rose-500/10"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom glassy select (listbox pattern). Keyboard-accessible: ArrowUp/Down
 * move the active option, Enter/Space commit, Escape closes, Home/End jump.
 * Focus stays on the combobox; the active option is announced via
 * aria-activedescendant, and the selected option gets an emerald highlight.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-md ${className}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const currentLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;

  // Close on outside pointer press.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-opt-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, listId]);

  const openList = () => {
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const commit = (i: number) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const activeId = open ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-label={label}
        onClick={() => (open ? (setOpen(false), triggerRef.current?.focus()) : openList())}
        onKeyDown={onKeyDown}
        className="glass-input flex w-full items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition"
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDownIcon
          size={15}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className="glass-popover absolute z-40 mt-2 w-full overflow-hidden rounded-xl"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {options.map((o, i) => {
              const selected = i === selectedIndex;
              const active = i === activeIndex;
              return (
                <div
                  key={o.value}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => commit(i)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-emerald-500/15 font-semibold text-emerald-200"
                      : "text-zinc-300"
                  } ${active && !selected ? "bg-zinc-700/50 text-zinc-100" : ""} ${
                    active && selected ? "bg-emerald-500/25" : ""
                  }`}
                >
                  {o.label}
                  {selected && <CheckIcon size={15} className="shrink-0 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

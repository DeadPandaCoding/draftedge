import { SwapIcon, TableIcon, ClockIcon, ArrowUpIcon, ListCheckIcon } from "@/components/icons";

export const TOOLS = {
  trade: {
    label: "Trade Analyzer", href: "/trade", Icon: SwapIcon,
    description: "See who wins a deal before you accept.", overview: "Compare both sides and see who wins.",
  },
  cheatsheet: {
    label: "Cheat Sheets", href: "/cheatsheet", Icon: TableIcon,
    description: "A draft board tuned to your league.", overview: "Browse player values, tiers, and ADP.",
  },
  mock: {
    label: "Mock Drafts", href: "/mock", Icon: ClockIcon,
    description: "Practice against position-aware picks.", overview: "Practice against realistic pick simulations.",
  },
  rankings: {
    label: "Player Rankings", href: "/rankings", Icon: ArrowUpIcon,
    description: "Projections, tiers, and ADP.", overview: "Projections, tiers, and ADP by position.",
  },
  startSit: {
    label: "Start/Sit", href: "/start-sit", Icon: ListCheckIcon,
    description: "Head-to-head calls and your best lineup.", overview: "Compare players and build a strong lineup.",
  },
} as const;

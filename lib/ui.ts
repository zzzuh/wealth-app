export const input =
  "rounded-lg border border-transparent bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none";

export const label = "text-xs font-medium text-slate-400";

export const buttonPrimary =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40";

export const buttonDanger =
  "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40";

export const buttonSecondary = "text-sm text-slate-400 transition-colors hover:text-slate-900";

export const buttonGhost = "text-xs text-slate-400 transition-colors hover:text-slate-900";
export const buttonGhostDanger = "text-xs text-slate-400 transition-colors hover:text-red-600";
export const buttonGhostSuccess = "text-xs text-slate-400 transition-colors hover:text-emerald-600";

export const link = "text-sm text-slate-400 transition-colors hover:text-slate-900";

// Small "+" affordance that sits next to a sectionLabel heading.
export const buttonAdd =
  "flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-sm leading-none text-slate-400 transition-colors hover:bg-slate-900 hover:text-white";

export const errorText = "text-sm text-red-600";

export const pageTitle = "text-xl font-semibold tracking-tight text-slate-900";
export const pageSubtitle = "mt-1 text-sm text-slate-400";

export const sectionLabel = "text-xs font-medium uppercase tracking-wider text-slate-400";

export const formShell = "flex flex-wrap items-end gap-4 rounded-xl bg-slate-50 p-4";

export const statCard = "space-y-3 rounded-xl bg-slate-50 p-5";
export const statValue = "text-3xl font-semibold tracking-tight text-slate-900 tabular-nums";

export const tableWrap = "border-t border-slate-100";
export const th = "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-400";
export const td = "px-4 py-3 text-sm text-slate-900 tabular-nums";
export const tdMuted = "px-4 py-3 text-sm text-slate-400 tabular-nums";
export const tr = "border-b border-slate-100 last:border-0";
export const emptyRow = "px-4 py-8 text-center text-sm text-slate-400";

export function pill(tone: "emerald" | "amber" | "red") {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`;
}

export function amountTone(value: number) {
  return value < 0 ? "text-red-600" : "text-emerald-600";
}

export const modalPanel =
  "w-full max-w-sm rounded-xl border border-slate-100 bg-white p-6 shadow-xl backdrop:bg-slate-900/20";
export const modalTitle = "text-sm font-semibold text-slate-900";

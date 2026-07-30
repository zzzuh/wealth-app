"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { sectionLabel, amountTone } from "@/lib/ui";

interface CashNeededResponse {
  target_date: string;
  cash_needed: number;
  breakdown: { statement_id: string; card_nickname: string; due_date: string; amount_due: number }[];
}

export default function CashNeededWidget({
  defaultDate,
  checkingBalance,
}: {
  defaultDate: string;
  checkingBalance: number | null;
}) {
  const [date, setDate] = useState(defaultDate);
  const [data, setData] = useState<CashNeededResponse | null>(null);

  const loading = data === null || data.target_date !== date;
  const surplus = !loading && checkingBalance != null ? checkingBalance - data.cash_needed : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cash-needed?date=${date}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <div className="space-y-4 rounded-xl bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <h2 className={sectionLabel}>Cash needed by</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-transparent bg-slate-100 px-2 py-1 text-xs text-slate-600 focus:border-slate-300 focus:bg-white focus:outline-none"
        />
      </div>

      {loading && <p className="text-sm text-slate-400">Loading...</p>}

      {!loading && data && (
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(data.cash_needed)}
          </p>
          {surplus != null && (
            <p className={`text-sm font-medium ${amountTone(surplus)}`}>
              {surplus < 0
                ? `Short ${formatCurrency(Math.abs(surplus))} vs. checking`
                : `${formatCurrency(surplus)} surplus vs. checking`}
            </p>
          )}
          {data.breakdown.length > 0 && (
            <ul className="space-y-1.5 pt-1 text-xs text-slate-400">
              {data.breakdown.map((b) => (
                <li key={b.statement_id} className="flex justify-between tabular-nums">
                  <span>{b.card_nickname}</span>
                  <span>{formatCurrency(b.amount_due)}</span>
                </li>
              ))}
            </ul>
          )}
          {data.breakdown.length === 0 && (
            <p className="text-xs text-slate-400">No unpaid statements due by this date.</p>
          )}
        </div>
      )}
    </div>
  );
}

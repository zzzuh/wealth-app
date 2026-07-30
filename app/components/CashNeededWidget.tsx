"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

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
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Cash needed by</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
      </div>

      {loading && <p className="text-sm text-slate-400">Loading...</p>}

      {!loading && data && (
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(data.cash_needed)}</p>
          {surplus != null && (
            <p className={`text-sm ${surplus < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {surplus < 0
                ? `Short ${formatCurrency(Math.abs(surplus))} vs. checking`
                : `${formatCurrency(surplus)} surplus vs. checking`}
            </p>
          )}
          {data.breakdown.length > 0 && (
            <ul className="space-y-1 text-xs text-slate-500">
              {data.breakdown.map((b) => (
                <li key={b.statement_id} className="flex justify-between">
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

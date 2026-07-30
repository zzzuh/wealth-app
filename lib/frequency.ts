export type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

export const OCCURRENCES_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "semimonthly", label: "Semimonthly" },
  { value: "monthly", label: "Monthly" },
];

export function frequencyLabel(frequency: string | null) {
  if (!frequency) return "Every paycheck";
  const match = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
  return match?.label ?? frequency;
}

/**
 * An expense's per-paycheck share, converting both the expense's own
 * frequency and the paycheck's cadence to occurrences/year first. E.g. $1200
 * monthly rent against biweekly (26/yr) paychecks is 1200*12/26 ≈ $553.85 —
 * not a clean half, because there are ~2 more paychecks than months per year.
 * Falls back to the full amount when either frequency is unknown, which
 * matches "every paycheck" behavior for expenses with no set frequency.
 */
export function prorateForPaycheck(
  amount: number,
  expenseFrequency: string | null,
  payFrequency: string | null
): number {
  if (!expenseFrequency || !payFrequency) return amount;
  const expenseOccurrences = OCCURRENCES_PER_YEAR[expenseFrequency as Frequency];
  const payOccurrences = OCCURRENCES_PER_YEAR[payFrequency as Frequency];
  if (!expenseOccurrences || !payOccurrences) return amount;
  return (amount * expenseOccurrences) / payOccurrences;
}

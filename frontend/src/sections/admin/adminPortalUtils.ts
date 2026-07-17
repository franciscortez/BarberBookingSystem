export const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const statusClass = (status: string) =>
  status === "completed" || status === "paid"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : status === "cancelled" || status === "failed" || status === "no_show"
      ? "bg-red-50 text-red-700 ring-red-200"
      : status === "confirmed" || status === "checked_in"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
export const money = (value: string | number | undefined) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value ?? 0),
  );
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

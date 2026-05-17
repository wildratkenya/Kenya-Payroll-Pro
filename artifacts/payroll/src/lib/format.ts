export function formatCurrency(amount: number | undefined | null) {
  if (amount == null) return "KSh 0.00";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace("KES", "KSh");
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

export function formatMonth(month: number | undefined, year: number | undefined) {
  if (!month || !year) return "N/A";
  const date = new Date(year, month - 1);
  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

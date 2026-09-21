export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function getHijriDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString();
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function rankedTaskLastUpdatedText(input: {
  collectedAt: string | null;
  formatInstant: (value: string) => string;
  label: string;
  missing: string;
}) {
  const value = input.collectedAt ? input.formatInstant(input.collectedAt) : input.missing;
  return `${input.label}: ${value}`;
}

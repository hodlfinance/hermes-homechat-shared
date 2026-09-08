/** Keep unknown or unavailable copy unchanged; localize only own string entries. */
export function localizedUiMessage(copy: Readonly<Record<string, string | undefined>>, message: string): string {
  const translated = Object.prototype.hasOwnProperty.call(copy, message) ? copy[message] : undefined;
  return typeof translated === "string" ? translated : message;
}

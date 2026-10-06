// HPD-1054 (Justus, 2026-10-06): voice runs stored before the hidden run
// context existed carry the voice model's task ("The user ...") plus the
// block "The user's exact spoken words ..." as the user's chat message. This
// stopgap shows such a stored message as the user's own last spoken words.
// New runs keep both parts in hidden run context and never need it.
const header = /\n\nThe user's exact spoken words \(speech transcript(?:, oldest first)?\):\n/;
const footer = "\nAct on the user's exact words. For names, file paths, commands, numbers and spellings, use the exact words above;"
  + " the request above them may paraphrase. If the two differ, follow the exact words.";

/** The text a chat shows for a stored user message; unchanged unless it ends with the old voice block. */
export function visibleUserMessageText(content: string): string {
  if (!content.endsWith(footer)) return content;
  const match = header.exec(content);
  if (!match) return content;
  const task = content.slice(0, match.index);
  const quoted = content.slice(match.index + match[0].length, content.length - footer.length).split("\n");
  if (!quoted.length || !quoted.every((line) => line.length >= 2 && line.startsWith("\"") && line.endsWith("\""))) return content;
  const latest = quoted.at(-1)!.slice(1, -1).trim();
  return latest || task.trim() || content;
}

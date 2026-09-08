export type AssistantMessageSegmentKind = "plain" | "bold";

export interface AssistantMessageLinkSegment {
  text: string;
  href?: string;
  kind: AssistantMessageSegmentKind;
}

const fencedCodePattern = /(```[\s\S]*?```)/g;
const boldRunPattern = /(\*\*(?!\s)(?:[^*]|\*(?!\*))+(?<!\s)\*\*)/g;
const wholeBoldRunPattern = /^\*\*(?!\s)(?:[^*]|\*(?!\*))+(?<!\s)\*\*$/;
const inlineCodePattern = /(`[^`\n]*`)/g;
const htmlAnchorPattern = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
const preserveMarkdownLinkPattern =
  /(!?\[[^\]\n]+\]\([^)]+\)|!?\[[^\]\n]+\](?:\[[^\]\n]*\])?|<https?:\/\/[^>\s]+>|<www\.[^>\s]+>)/g;
const inlineMarkdownLinkPattern = /!?\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const referenceMarkdownLinkPattern = /\[([^\]\n]+)\]\[([^\]\n]*)\]/g;
const shortcutReferencePattern = /\[([^\]\n]+)\]/g;
const referenceDefinitionPattern = /^\s*\[([^\]\n]+)\]:\s+(\S+)(?:\s+.*)?$/;
const bareAssistantLinkPattern =
  /(?:https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+|\/(?:api|app|pages|pricing|support|contact|about|privacy|terms)(?:[/?#][^\s<>"'`]*)?)/g;

export function normalizeAssistantMarkdownLinks(markdown: string) {
  return preserveCode(markdown, (text) =>
    text
      .replace(htmlAnchorPattern, (_raw, _quote: string, href: string, label: string) => {
        return `[${escapeMarkdownLinkText(stripHtml(label))}](${href.trim()})`;
      })
      .split("\n")
      .map((line) => {
        if (referenceDefinitionPattern.test(line)) return line;
        return linkifyPlainMarkdownText(line);
      })
      .join("\n"),
  );
}

export function assistantMessageLinkSegments(markdown: string): AssistantMessageLinkSegment[] {
  const definitions = referenceDefinitionsFrom(markdown);
  const visibleMarkdown = normalizeAssistantMarkdownLinks(markdown)
    .split("\n")
    .filter((line) => !referenceDefinitionPattern.test(line))
    .join("\n")
    .trimEnd();
  const segments: AssistantMessageLinkSegment[] = [];

  const pushText = (text: string, kind: AssistantMessageSegmentKind) => {
    if (text) segments.push({ text, kind });
  };
  const pushLinkedText = (text: string, kind: AssistantMessageSegmentKind, href?: string) => {
    if (!text) return;
    if (href) {
      segments.push({ text, href, kind });
      return;
    }
    pushText(text, kind);
  };

  type ProtectedLink = { label: string; href?: string; image: boolean };

  const pushFormattedText = (
    text: string,
    inheritedKind: AssistantMessageSegmentKind = "plain",
    inheritedHref?: string,
  ) => {
    const links: ProtectedLink[] = [];
    const protect = (link: ProtectedLink) => {
      const index = links.push(link) - 1;
      return `\u0000${index}\u0000`;
    };
    const protectedText = text
      .replace(inlineMarkdownLinkPattern, (raw, label: string, href: string) =>
        protect({ label, href: raw.startsWith("!") ? undefined : href, image: raw.startsWith("!") }),
      )
      .replace(referenceMarkdownLinkPattern, (raw, label: string, reference: string) => {
        const href = definitions.get(referenceKey(reference || label));
        return href ? protect({ label, href, image: false }) : raw;
      })
      .replace(shortcutReferencePattern, (raw, label: string) => {
        const href = definitions.get(referenceKey(label));
        return href ? protect({ label, href, image: false }) : raw;
      });

    const pushProtected = (value: string, kind: AssistantMessageSegmentKind) => {
      let lastIndex = 0;
      for (const match of value.matchAll(/\u0000(\d+)\u0000/g)) {
        const index = match.index ?? 0;
        if (index > lastIndex) pushLinkedText(value.slice(lastIndex, index), kind, inheritedHref);
        const link = links[Number(match[1])];
        if (link) {
          pushFormattedText(link.label, kind, link.image ? inheritedHref : link.href);
        }
        lastIndex = index + match[0].length;
      }
      if (lastIndex < value.length) pushLinkedText(value.slice(lastIndex), kind, inheritedHref);
    };

    for (const part of protectedText.split(boldRunPattern)) {
      if (!part) continue;
      if (wholeBoldRunPattern.test(part)) {
        pushProtected(part.slice(2, -2), "bold");
      } else {
        pushProtected(part, inheritedKind);
      }
    }
  };

  visibleMarkdown.split(fencedCodePattern).forEach((fencedPart) => {
    if (fencedPart.startsWith("```")) {
      pushText(fencedPart, "plain");
      return;
    }
    fencedPart.split(inlineCodePattern).forEach((part) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        pushText(part, "plain");
      } else {
        pushFormattedText(part);
      }
    });
  });

  return segments.length ? segments : [{ text: visibleMarkdown || markdown, kind: "plain" }];
}

function preserveCode(markdown: string, transform: (text: string) => string) {
  return markdown
    .split(fencedCodePattern)
    .map((fencedPart) => {
      if (fencedPart.startsWith("```")) return fencedPart;
      return fencedPart
        .split(inlineCodePattern)
        .map((part) => (part.startsWith("`") && part.endsWith("`") ? part : transform(part)))
        .join("");
    })
    .join("");
}

function linkifyPlainMarkdownText(text: string) {
  return text
    .split(preserveMarkdownLinkPattern)
    .map((part) => {
      if (
        /^!?\[[^\]\n]+\]\([^)]+\)$/.test(part) ||
        /^!?\[[^\]\n]+\](?:\[[^\]\n]*\])?$/.test(part) ||
        /^<https?:\/\/[^>\s]+>$/.test(part) ||
        /^<www\.[^>\s]+>$/.test(part)
      ) {
        return part;
      }
      return part.replace(bareAssistantLinkPattern, (match) => {
        const { target, suffix } = splitTrailingLinkPunctuation(match);
        const href = target.startsWith("www.") ? `https://${target}` : target;
        return `[${target}](${href})${suffix}`;
      });
    })
    .join("");
}

function referenceDefinitionsFrom(markdown: string) {
  const definitions = new Map<string, string>();
  for (const line of markdown.split("\n")) {
    const match = referenceDefinitionPattern.exec(line);
    if (!match) continue;
    definitions.set(referenceKey(match[1] || ""), match[2] || "");
  }
  return definitions;
}

function referenceKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function escapeMarkdownLinkText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

function splitTrailingLinkPunctuation(value: string) {
  let target = value;
  let suffix = "";
  while (/[),.;:!?]$/.test(target)) {
    const last = target.slice(-1);
    if (last === ")" && (target.match(/\(/g)?.length ?? 0) >= (target.match(/\)/g)?.length ?? 0)) break;
    suffix = `${last}${suffix}`;
    target = target.slice(0, -1);
  }
  return { target, suffix };
}

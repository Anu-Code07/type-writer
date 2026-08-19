const ALLOWED_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "DEL",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "BR",
  "HR",
  "A",
  "SPAN",
  "DIV",
]);

export const isRichHtml = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content.trim());

export const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const plainTextToHtml = (content: string) => {
  if (!content.trim()) {
    return "";
  }

  if (isRichHtml(content)) {
    return content;
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
};

export const htmlToPlainText = (content: string) => {
  if (!content.trim()) {
    return "";
  }

  if (!isRichHtml(content)) {
    return content;
  }

  return content
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const htmlToMarkdown = (content: string) => {
  if (!isRichHtml(content)) {
    return content;
  }

  return content
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "$1")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<(ul|ol)[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const isEmptyHtml = (content: string) => htmlToPlainText(content).length === 0;

const unwrapDisallowed = (element: Element) => {
  const parent = element.parentNode;

  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
};

export const sanitizeHtml = (html: string) => {
  if (!html.trim() || typeof window === "undefined") {
    return html;
  }

  const documentNode = new DOMParser().parseFromString(html, "text/html");

  const visit = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const element = child as HTMLElement;

      if (!ALLOWED_TAGS.has(element.tagName)) {
        unwrapDisallowed(element);
        visit(node);
        return;
      }

      [...element.attributes].forEach((attribute) => {
        const isSafeLink =
          element.tagName === "A" &&
          attribute.name === "href" &&
          /^(https?:|mailto:)/i.test(attribute.value);
        const isClass = attribute.name === "class";

        if (!isSafeLink && !isClass) {
          element.removeAttribute(attribute.name);
        }
      });

      visit(element);
    });
  };

  visit(documentNode.body);
  return documentNode.body.innerHTML;
};

export const paginateHtml = (content: string, charactersPerPage = 760) => {
  const html = sanitizeHtml(plainTextToHtml(content));

  if (!html) {
    return [""];
  }

  const blocks = html.match(/<(p|h1|h2|h3|ul|ol|blockquote|div)[\s\S]*?<\/\1>|<hr\s*\/?>/gi) ?? [html];
  const pages: string[] = [];
  let current = "";
  let currentLength = 0;

  blocks.forEach((block) => {
    const blockLength = htmlToPlainText(block).length || 1;

    if (current && currentLength + blockLength > charactersPerPage) {
      pages.push(current);
      current = block;
      currentLength = blockLength;
      return;
    }

    current += block;
    currentLength += blockLength;
  });

  if (current) {
    pages.push(current);
  }

  return pages.length > 0 ? pages : [""];
};

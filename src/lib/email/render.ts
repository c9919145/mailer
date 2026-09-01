export interface EmailVariables {
  [key: string]: string | number | null | undefined;
}

export function renderTemplate(
  content: string,
  variables: EmailVariables = {}
): string {
  let rendered = content;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    rendered = rendered.replace(placeholder, String(value ?? ""));
  }

  // Remove any remaining unresolved placeholders
  rendered = rendered.replace(/\{\{\s*[\w.]+\s*\}\}/g, "");

  return rendered;
}

export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{\s*([\w.]+)\s*\}\}/g) || [];
  const unique = Array.from(new Set(matches));

  return unique.map((m) => {
    const name = m.match(/\{\{\s*([\w.]+)\s*\}\}/);
    return name ? name[1] : m;
  });
}

export function getContactVariables(contact: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  company?: string | null;
  phone?: string | null;
  customData?: unknown;
}): EmailVariables {
  const vars: EmailVariables = {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    fullName: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    email: contact.email,
    company: contact.company || "",
    phone: contact.phone || "",
  };

  if (contact.customData && typeof contact.customData === "object") {
    const data = contact.customData as Record<string, unknown>;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string" || typeof value === "number") {
        vars[key] = value;
      }
    }
  }

  return vars;
}

export function generatePlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

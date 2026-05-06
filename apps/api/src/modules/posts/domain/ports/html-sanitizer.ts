export interface HtmlSanitizer {
  sanitize(unsafeHtml: string): string;
  toPlainText(html: string): string;
}

export const HTML_SANITIZER = Symbol('HTML_SANITIZER');

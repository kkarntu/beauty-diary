import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import type { HtmlSanitizer } from '../domain/ports/html-sanitizer';

/**
 * Whitelist matches what Tiptap's StarterKit + Link + Image extensions
 * can produce. Anything else is stripped on save — defence-in-depth so
 * a malicious or compromised editor can't inject scripts.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'code',
    'pre',
    'br',
    'hr',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'],
    span: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        // Force safe defaults on outbound links
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
  },
};

@Injectable()
export class SanitizeHtmlSanitizer implements HtmlSanitizer {
  sanitize(unsafeHtml: string): string {
    return sanitizeHtml(unsafeHtml, SANITIZE_OPTIONS);
  }

  toPlainText(html: string): string {
    return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  }
}

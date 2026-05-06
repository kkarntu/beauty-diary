import { SanitizeHtmlSanitizer } from './sanitize-html.sanitizer';

describe('SanitizeHtmlSanitizer', () => {
  const sanitizer = new SanitizeHtmlSanitizer();

  it('strips <script> tags', () => {
    const out = sanitizer.sanitize('<p>safe</p><script>alert(1)</script>');
    expect(out).not.toMatch(/<script/);
    expect(out).toContain('<p>safe</p>');
  });

  it('strips inline event handlers', () => {
    const out = sanitizer.sanitize('<p onclick="evil()">click me</p>');
    expect(out).not.toMatch(/onclick/);
    expect(out).toContain('click me');
  });

  it('strips javascript: URLs in links', () => {
    const out = sanitizer.sanitize('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/);
  });

  it('forces rel + target on outbound links', () => {
    const out = sanitizer.sanitize('<a href="https://example.com">link</a>');
    expect(out).toMatch(/rel="noopener noreferrer nofollow"/);
    expect(out).toMatch(/target="_blank"/);
  });

  it('preserves the Tiptap StarterKit tag set', () => {
    const html =
      '<h1>title</h1><p><strong>bold</strong> <em>em</em> <s>strike</s></p>' +
      '<ul><li>a</li></ul><ol><li>b</li></ol>' +
      '<blockquote>q</blockquote>' +
      '<pre><code>x</code></pre>' +
      '<hr><br>';
    const out = sanitizer.sanitize(html);
    for (const tag of [
      'h1',
      'p',
      'strong',
      'em',
      's',
      'ul',
      'li',
      'ol',
      'blockquote',
      'pre',
      'code',
      'hr',
      'br',
    ]) {
      expect(out).toMatch(new RegExp(`<${tag}`));
    }
  });

  it('keeps img with safe attributes only', () => {
    const out = sanitizer.sanitize(
      '<img src="https://x.com/a.jpg" alt="cover" onerror="evil()">',
    );
    expect(out).toMatch(/src="https:\/\/x\.com\/a\.jpg"/);
    expect(out).toMatch(/alt="cover"/);
    expect(out).not.toMatch(/onerror/);
  });

  it('toPlainText strips tags entirely', () => {
    const text = sanitizer.toPlainText('<p>hello <strong>world</strong></p>');
    expect(text).toBe('hello world');
  });
});

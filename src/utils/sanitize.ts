import DOMPurify from 'dompurify'

export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value.trim(), { ALLOWED_TAGS: [] })
}

export function sanitizeHtml(value: string): string {
  return DOMPurify.sanitize(value.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  })
}

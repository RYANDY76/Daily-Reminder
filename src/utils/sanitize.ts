export function sanitizeInput(value: string): string {
  return value.trim().replace(/<[^>]*>/g, '')
}

export function sanitizeHtml(value: string): string {
  return value.trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<(?!\/?(b|i|em|strong|a)(?:\s[^>]*)?>)[^>]+>/g, '')
}

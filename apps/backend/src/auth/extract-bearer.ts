/**
 * Parse an RFC 6750 `Authorization: Bearer <token>` header.
 * This is syntax only — never trust the result until the signature is verified.
 */
export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;

  // Scheme is case-insensitive; one or more spaces are valid; a comma means
  // duplicate headers were merged by the Fetch implementation.
  const match = /^Bearer[ ]+([^\s,]+)$/i.exec(header.trim());
  if (!match) return null;

  const token = match[1];
  if (!token) return null;

  // Cheap shape check: a JWT is three base64url segments.
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;

  return token;
}

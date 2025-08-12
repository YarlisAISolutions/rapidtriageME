/**
 * UUID Generator for Cloudflare Workers
 * Generates RFC4122 v4 compliant UUIDs
 */

export function generateUUID(): string {
  // Generate 16 random bytes
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // Set version (4) and variant bits according to RFC4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  
  // Convert to hex string with hyphens
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}
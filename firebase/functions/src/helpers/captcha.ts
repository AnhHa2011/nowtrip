/**
 * Verify Cloudflare Turnstile token.
 * Temporary stub for emulator/dev: accepts any non-empty token length > 5.
 *
 * @param {string} token Turnstile response token from client.
 * @return {Promise<boolean>} True if token is considered valid.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  return Boolean(token && token.length > 5);
}

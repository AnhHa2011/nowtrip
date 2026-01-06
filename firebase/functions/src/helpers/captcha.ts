export async function verifyTurnstile(token: string): Promise<boolean> {
    // TODO: implement real HTTP verify with secret
    // For now in emulator: accept any non-empty token
    return Boolean(token && token.length > 5);
}

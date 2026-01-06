export function normalizeVNPhone(input: string): string {
    const digits = (input || "").replace(/\D/g, "");
    // Basic VN normalization:
    // 0xxxxxxxxx => 84xxxxxxxxx
    // 84xxxxxxxxx stays
    if (digits.startsWith("84")) return digits;
    if (digits.startsWith("0")) return "84" + digits.slice(1);
    return digits; // fallback
}

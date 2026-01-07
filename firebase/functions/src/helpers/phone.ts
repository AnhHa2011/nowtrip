/**
 * Chuẩn hoá số điện thoại
 * @param {string} phone Số điện thoại đầu vào
 * @return {string} Số đã chuẩn hoá
 */
export function normalizeVNPhone(phone: string): string {
  let p = phone.replace(/\D/g, ""); // remove non-digits
  if (p.startsWith("84")) {
    p = "0" + p.slice(2);
  }
  return p;
}

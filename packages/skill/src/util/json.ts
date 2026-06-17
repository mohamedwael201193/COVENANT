/** JSON.stringify replacer — BigInt and other non-JSON values become strings. */
export function jsonSafeStringify(value: unknown, space?: number): string {
  return JSON.stringify(
    value,
    (_key, v) => (typeof v === "bigint" ? v.toString() : v),
    space,
  );
}

import { createHash } from "crypto";

export function stableId(kind: string, key: string): string {
  const hex = createHash("sha1").update(`dhabar:${kind}:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export const OUTLET_ID = stableId("outlet", "dhabar");

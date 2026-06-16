import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export const TIER_NAMES = ["UNTRUSTED", "BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;

export function tierName(tier: number): string {
  return TIER_NAMES[tier] ?? `TIER_${tier}`;
}

export const PHAROS_EXPLORER = "https://atlantic.pharosscan.xyz";

export function explorerTxUrl(txHash: string): string {
  return `${PHAROS_EXPLORER}/tx/${txHash}`;
}

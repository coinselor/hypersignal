import { useDateFormat, useTimeAgo } from "@vueuse/core";

export function formatDate(timestamp: number) {
  return useDateFormat(timestamp * 1000, "YYYY-MM-DD HH:mm:ss", {
    locales: "en-US",
  }).value;
}

export function formatFriendlyDate(timestamp: number) {
  return useTimeAgo(timestamp * 1000, { showSecond: false }).value;
}

export function truncateHash(hash?: string, start = 6, end = 4) {
  if (!hash)
    return "";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

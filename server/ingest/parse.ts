/** Pure URL/timecode parsing — kept DB-free so it can be unit-tested directly. */

export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /[?&]v=([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseTimeCode(tc: string): number {
  const parts = tc.split(":").map(Number).reverse();
  return parts.reduce((acc, val, i) => acc + val * Math.pow(60, i), 0);
}

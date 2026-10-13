export function ratingWord(r: number) {
  if (r >= 9) return "Superb";
  if (r >= 8.5) return "Excellent";
  if (r >= 8) return "Very good";
  if (r >= 7) return "Good";
  return "Pleasant";
}

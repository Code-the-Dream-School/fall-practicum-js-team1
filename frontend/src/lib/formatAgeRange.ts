export function formatAgeRange(
  minMonths: number | null,
  maxMonths: number | null,
): string {
  if (minMonths === null && maxMonths === null) {
    return 'All ages';
  }

  if (minMonths === null) {
    return `Up to ${maxMonths} months`;
  }

  if (maxMonths === null) {
    return `${minMonths}+ months`;
  }

  if (minMonths === maxMonths) {
    return `${minMonths} months`;
  }

  return `${minMonths} to ${maxMonths} months`;
}

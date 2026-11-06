const MONTHS_IN_YEAR = 12;
const toUnit = (months: number) => {
  if (months >= MONTHS_IN_YEAR && months % MONTHS_IN_YEAR === 0) {
    const years = months / MONTHS_IN_YEAR;
    return { value: years, unit: years === 1 ? 'year' : 'years' };
  }

  return { value: months, unit: months === 1 ? 'month' : 'months' };
};

const label = (months: number) => {
  const { value, unit } = toUnit(months);
  return `${value} ${unit}`;
};

export function formatAgeRange(
  minMonths: number | null,
  maxMonths: number | null,
): string {
  if (minMonths === null) {
    return maxMonths === null ? 'All ages' : `Up to ${label(maxMonths)}`;
  }

  if (maxMonths === null) {
    const { value, unit } = toUnit(minMonths);
    return `${value}+ ${unit}`;
  }

  if (minMonths === maxMonths) {
    return label(minMonths);
  }

  const min = toUnit(minMonths);
  const max = toUnit(maxMonths);

  if (min.unit === max.unit || minMonths === 0) {
    return `${min.value} to ${max.value} ${max.unit}`;
  }

  return `${label(minMonths)} to ${label(maxMonths)}`;
}

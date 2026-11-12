const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// "Oct 12, 2026"
export const formatShortDate = (isoDate: string) => {
  return shortDate.format(new Date(isoDate));
};

const INITIALS_COUNT = 2;

// "Sam Lee" becomes "SL"
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, INITIALS_COUNT)
    .join('')
    .toUpperCase();
};

export type AddressDraft = {
  nickname: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

export const emptyAddress: AddressDraft = {
  nickname: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

// Returns an error message for each required field that is empty
export const validateAddress = (draft: AddressDraft) => {
  const errors: Record<string, string> = {};

  if (!draft.line1.trim()) {
    errors['line1'] = 'Enter your street address.';
  }
  if (!draft.city.trim()) {
    errors['city'] = 'Enter your city.';
  }
  if (!draft.state.trim()) {
    errors['state'] = 'Enter your state.';
  }
  if (!draft.postalCode.trim()) {
    errors['postalCode'] = 'Enter your postal code.';
  }

  return errors;
};

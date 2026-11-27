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

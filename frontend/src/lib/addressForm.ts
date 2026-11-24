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

export const addressAutoComplete: Partial<Record<keyof AddressDraft, string>> =
  {
    line1: 'address-line1',
    line2: 'address-line2',
    city: 'address-level2',
    postalCode: 'postal-code',
  };

export const addressFields: {
  key: keyof AddressDraft;
  label: string;
  required: boolean;
}[] = [
  { key: 'nickname', label: 'Nickname', required: false },
  { key: 'line1', label: 'Street address', required: true },
  { key: 'line2', label: 'Apartment or unit', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'postalCode', label: 'Postal code', required: true },
];

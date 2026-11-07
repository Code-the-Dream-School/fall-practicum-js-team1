// One address in GET /api/addresses
export default interface Address {
  id: string;
  nickname: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

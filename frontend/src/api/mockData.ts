// Fake data for the api while we are in mock mode.
// New users, addresses and items are only saved temporarily, so they go away when you refresh.
// The signed in user is saved in sessionStorage, so you stay signed in after a refresh.
// To sign in, use any email in mockData.json and MOCK_PASSWORD.
import mockData from './mockData.json' with { type: 'json' };

export const MOCK_PASSWORD = 'Password123';
const CSRF_TOKEN = 'mock-csrf-token';
const DEFAULT_LIMIT = 12;
const SESSION_KEY = 'mockUserId';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type Photo = {
  id: string;
  url: string;
  altText: string;
  position: number;
};

type Address = {
  id: string;
  userId: string;
  nickname: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type Item = {
  id: string;
  ownerId: string;
  category: string;
  title: string;
  description: string;
  condition: string;
  status: string;
  childAgeMinMonths: number | null;
  childAgeMaxMonths: number | null;
  addressId: string;
  instructions: string;
  availability: string;
  createdAt: string;
  reservedAt: string | null;
  pickedUpAt: string | null;
  photos: Photo[];
};

type Claim = {
  id: string;
  itemId: string;
  claimerId: string;
  status: string;
  message: string;
  createdAt: string;
  decidedAt: string | null;
  pickedUpAt: string | null;
};

// what the Home page can send to getItems
export type ItemFilters = {
  q?: string;
  category?: string;
  condition?: string;
  city?: string;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
};

// what the Post an item form sends
export type NewItem = {
  title: string;
  description: string;
  category: string;
  condition: string;
  childAgeMinMonths?: number;
  childAgeMaxMonths?: number;
  addressId: string;
  instructions?: string;
  availability?: string;
  photos: { url: string; altText?: string }[];
};

export type NewAddress = {
  nickname?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
};

// I copy the arrays so adding something does not change the json file
const users: User[] = [...mockData.users];
const addresses: Address[] = [...mockData.addresses];
const items: Item[] = [...mockData.items];
const claims: Claim[] = [...mockData.claims];

// Users

export const getSignedInUser = (): User | undefined => {
  const id = sessionStorage.getItem(SESSION_KEY);
  return users.find((user) => user.id === id);
};

export const signIn = (user: User) => {
  sessionStorage.setItem(SESSION_KEY, user.id);
};

export const signOut = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const findUserByEmail = (email: string): User | undefined => {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

export const addUser = (name: string, email: string): User => {
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
};

// what login, register and /users/me send back
export const getAuthData = (user: User) => {
  return { user, csrfToken: CSRF_TOKEN };
};

// Categories

export const getCategories = () => {
  return mockData.categories.map((category) => ({
    id: category.id,
    key: category.key,
    name: category.name,
  }));
};

// Items

const getAddressOfItem = (item: Item): Address => {
  const address = addresses.find((a) => a.id === item.addressId);
  if (!address) {
    throw new Error('No address for item ' + item.id);
  }
  return address;
};

const getCategoryOfItem = (item: Item) => {
  const category = mockData.categories.find((c) => c.key === item.category);
  return { key: item.category, name: category ? category.name : item.category };
};

const getCoverPhoto = (item: Item) => {
  const firstPhoto = item.photos[0];
  if (!firstPhoto) {
    return null;
  }
  return { url: firstPhoto.url, altText: firstPhoto.altText };
};

// the short item for the lists and the cards (no description, owner or street address)
const makeShortItem = (item: Item) => {
  const address = getAddressOfItem(item);
  return {
    id: item.id,
    title: item.title,
    condition: item.condition,
    childAgeMinMonths: item.childAgeMinMonths,
    childAgeMaxMonths: item.childAgeMaxMonths,
    city: address.city,
    state: address.state,
    status: item.status,
    category: getCategoryOfItem(item),
    coverPhoto: getCoverPhoto(item),
  };
};

// the item for the details page (still no street address or pickup instructions)
const makeFullItem = (item: Item) => {
  const address = getAddressOfItem(item);
  const owner = users.find((user) => user.id === item.ownerId);
  return {
    ...makeShortItem(item),
    description: item.description,
    owner: { id: item.ownerId, name: owner ? owner.name : '' },
    postalCode: address.postalCode,
    photos: item.photos,
    createdAt: item.createdAt,
  };
};

// checks one item against all the filters
const itemMatches = (item: Item, filters: ItemFilters): boolean => {
  if (item.status === 'withdrawn') {
    return false;
  }

  const search = (filters.q || '').toLowerCase();
  const inTitle = item.title.toLowerCase().includes(search);
  const inDescription = item.description.toLowerCase().includes(search);
  if (search && !inTitle && !inDescription) {
    return false;
  }

  if (filters.category && item.category !== filters.category) {
    return false;
  }

  if (filters.condition && item.condition !== filters.condition) {
    return false;
  }

  const city = getAddressOfItem(item).city.toLowerCase();
  if (filters.city && !city.startsWith(filters.city.trim().toLowerCase())) {
    return false;
  }

  // the age range of the item has to overlap the filter
  // if the item has no min or no max, that side is open
  const itemMin = item.childAgeMinMonths ?? 0;
  const itemMax = item.childAgeMaxMonths ?? Infinity;
  const wantedMin = filters.ageMin ?? 0;
  const wantedMax = filters.ageMax ?? Infinity;
  return !(itemMin > wantedMax || itemMax < wantedMin);
};

export const getItems = (filters: ItemFilters = {}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || DEFAULT_LIMIT;

  // newest first
  const matches = items
    .filter((item) => itemMatches(item, filters))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const start = (page - 1) * limit;
  const pages = Math.ceil(matches.length / limit);

  return {
    items: matches.slice(start, start + limit).map(makeShortItem),
    pagination: {
      page,
      limit,
      total: matches.length,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};

// returns undefined if there is no item, a withdrawn item counts as not found
export const findItem = (id: string) => {
  const item = items.find((i) => i.id === id);
  if (!item || item.status === 'withdrawn') {
    return undefined;
  }
  return makeFullItem(item);
};

export const addItem = (user: User, body: NewItem) => {
  const photos: Photo[] = body.photos.map((photo, index) => ({
    id: crypto.randomUUID(),
    url: photo.url,
    altText: photo.altText || '',
    position: index,
  }));

  const item: Item = {
    id: crypto.randomUUID(),
    ownerId: user.id,
    category: body.category,
    title: body.title,
    description: body.description,
    condition: body.condition,
    status: 'available',
    childAgeMinMonths: body.childAgeMinMonths ?? null,
    childAgeMaxMonths: body.childAgeMaxMonths ?? null,
    addressId: body.addressId,
    instructions: body.instructions || '',
    availability: body.availability || '',
    createdAt: new Date().toISOString(),
    reservedAt: null,
    pickedUpAt: null,
    photos,
  };
  items.push(item);
  return makeFullItem(item);
};

// Addresses

const makeAddress = (address: Address) => {
  return {
    id: address.id,
    nickname: address.nickname,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
};

export const getAddresses = (user: User) => {
  // the default address goes first
  return addresses
    .filter((address) => address.userId === user.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map(makeAddress);
};

export const addAddress = (user: User, body: NewAddress) => {
  const hasAddress = addresses.some((a) => a.userId === user.id);

  const address: Address = {
    id: crypto.randomUUID(),
    userId: user.id,
    nickname: body.nickname || '',
    line1: body.line1,
    line2: body.line2 || null,
    city: body.city,
    state: body.state,
    postalCode: body.postalCode,
    country: 'US',
    // the first address of a user is the default
    isDefault: !hasAddress,
  };
  addresses.push(address);
  return makeAddress(address);
};

// Uploads

export const CLOUDINARY_UPLOAD_URL =
  'https://api.cloudinary.com/v1_1/mock-cloud/image/upload';

export const getUploadSignature = () => {
  return {
    cloudName: 'mock-cloud',
    apiKey: 'mock-api-key',
    timestamp: Date.now(),
    folder: 'hand-me-down/items',
    signature: 'mock-signature',
  };
};

// what cloudinary sends back after a photo is uploaded
export const getFakeUploadResult = () => {
  const id = crypto.randomUUID();
  return {
    secure_url: 'https://picsum.photos/seed/' + id + '/800/600',
    public_id: 'hand-me-down/items/' + id,
  };
};

// Profile

export const getMyItems = (user: User) => {
  return items
    .filter((item) => item.ownerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(makeShortItem);
};

export const getMyClaims = (user: User, status?: string) => {
  return claims
    .filter((claim) => claim.claimerId === user.id)
    .filter((claim) => !status || claim.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((claim) => {
      const item = items.find((i) => i.id === claim.itemId);
      if (!item) {
        throw new Error('No item for claim ' + claim.id);
      }
      const address = getAddressOfItem(item);

      // the street address is only shared while the claim is approved
      let pickup = null;
      if (claim.status === 'approved') {
        pickup = {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          instructions: item.instructions,
          availability: item.availability,
        };
      }

      return {
        id: claim.id,
        status: claim.status,
        createdAt: claim.createdAt,
        item: {
          id: item.id,
          title: item.title,
          status: item.status,
          coverPhoto: getCoverPhoto(item),
        },
        pickup,
      };
    });
};

const countClaims = (list: Claim[], status: string): number => {
  return list.filter((claim) => claim.status === status).length;
};

export const getMyStats = (user: User) => {
  const myItems = items.filter((item) => item.ownerId === user.id);
  const claimsOnMyItems = claims.filter((claim) =>
    myItems.some((item) => item.id === claim.itemId),
  );
  const myClaims = claims.filter((claim) => claim.claimerId === user.id);

  return {
    donations: {
      posted: myItems.filter((item) => item.status !== 'withdrawn').length,
      waitingForYou: countClaims(claimsOnMyItems, 'pending'),
      // an approved claim makes the item reserved
      approved: myItems.filter((item) => item.status === 'reserved').length,
      pickedUp: myItems.filter((item) => item.status === 'picked_up').length,
    },
    claims: {
      requested: myClaims.length,
      waitingForOwner: countClaims(myClaims, 'pending'),
      approved: countClaims(myClaims, 'approved'),
      pickedUp: countClaims(myClaims, 'picked_up'),
    },
  };
};

// the owner sees who requested the item (GET /api/items/:id/claims)
export const getItemClaims = (itemId: string) => {
  return claims
    .filter((claim) => claim.itemId === itemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((claim) => {
      const claimer = users.find((user) => user.id === claim.claimerId);
      return {
        id: claim.id,
        itemId: claim.itemId,
        status: claim.status,
        message: claim.message,
        claimer: { id: claim.claimerId, name: claimer ? claimer.name : '' },
        createdAt: claim.createdAt,
      };
    });
};

// the owner approves or declines a pending claim (PATCH /api/claims/:id)
export const decideClaim = (
  claimId: string,
  status: 'approved' | 'declined',
) => {
  const claim = claims.find((c) => c.id === claimId);
  if (!claim || claim.status !== 'pending') {
    throw new Error('Only a pending request can be answered');
  }

  const item = items.find((i) => i.id === claim.itemId);
  if (!item) {
    throw new Error('No item for claim ' + claim.id);
  }

  if (status === 'approved') {
    const hasApproved = claims.some(
      (c) => c.itemId === item.id && c.status === 'approved',
    );
    if (hasApproved) {
      throw new Error('This item already has an approved request');
    }
    // an approved claim makes the item reserved
    item.status = 'reserved';
    item.reservedAt = new Date().toISOString();
  }

  claim.status = status;
  claim.decidedAt = new Date().toISOString();
  return { id: claim.id, status: claim.status };
};

// the claimer changes their mind (PATCH /api/claims/:id/cancel)
export const cancelClaim = (claimId: string) => {
  const claim = claims.find((c) => c.id === claimId);
  if (!claim || (claim.status !== 'pending' && claim.status !== 'approved')) {
    throw new Error('Only a pending or approved request can be cancelled');
  }

  // cancelling an approved claim puts the item back
  if (claim.status === 'approved') {
    const item = items.find((i) => i.id === claim.itemId);
    if (item) {
      item.status = 'available';
      item.reservedAt = null;
    }
  }

  claim.status = 'cancelled';
  return { id: claim.id, status: claim.status };
};

// the owner marks the approved request as picked up (PATCH /api/items/:id/picked-up)
export const markPickedUp = (itemId: string) => {
  const item = items.find((i) => i.id === itemId);
  if (!item || item.status !== 'reserved') {
    throw new Error('Only a reserved item can be marked as picked up');
  }

  const now = new Date().toISOString();
  claims
    .filter((claim) => claim.itemId === itemId)
    .forEach((claim) => {
      if (claim.status === 'approved') {
        claim.status = 'picked_up';
        claim.pickedUpAt = now;
      } else if (claim.status === 'pending') {
        // everyone still waiting is told no
        claim.status = 'declined';
        claim.decidedAt = now;
      }
    });

  item.status = 'picked_up';
  item.pickedUpAt = now;
  return { id: item.id, status: item.status };
};

// the approved person did not show up (PATCH /api/claims/:id/no-show)
export const markNoShow = (claimId: string) => {
  const claim = claims.find((c) => c.id === claimId);
  if (!claim || claim.status !== 'approved') {
    throw new Error('Only an approved request can be marked as a no-show');
  }

  const item = items.find((i) => i.id === claim.itemId);
  if (item) {
    item.status = 'available';
    item.reservedAt = null;
  }

  claim.status = 'no_show';
  return { id: claim.id, status: claim.status };
};

// brings a withdrawn item back
export const restoreItem = (itemId: string) => {
  const item = items.find((i) => i.id === itemId);
  if (!item || item.status !== 'withdrawn') {
    throw new Error('Only a withdrawn item can be restored');
  }

  item.status = 'available';
  return { id: item.id, status: item.status };
};

// the owner takes the item down (PATCH /api/items/:id/withdraw)
export const withdrawItem = (itemId: string) => {
  const item = items.find((i) => i.id === itemId);
  if (!item || (item.status !== 'available' && item.status !== 'reserved')) {
    throw new Error('Only an available or reserved item can be withdrawn');
  }

  const now = new Date().toISOString();
  claims
    .filter((claim) => claim.itemId === itemId)
    .forEach((claim) => {
      if (claim.status === 'pending') {
        claim.status = 'declined';
        claim.decidedAt = now;
      } else if (claim.status === 'approved') {
        claim.status = 'cancelled';
      }
    });

  item.status = 'withdrawn';
  item.reservedAt = null;
  return { id: item.id, status: item.status };
};

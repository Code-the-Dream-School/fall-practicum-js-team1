import { useState } from 'react';
import type { FormEvent } from 'react';

import mockData from '../api/mockData.json';
import { useCategories } from '../hooks/useCategories';
import ItemPhotoPicker from '../components/ItemPhotoPicker';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type Address = {
  id: string;
  nickname: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type AddressResponse = {
  id: string | number;
  nickname?: string | null;
  nickanme?: string | null;
  city: string;
  state: string;
  isDefault?: boolean;
};

type FieldName =
  | 'title'
  | 'description'
  | 'category'
  | 'condition'
  | 'ageTo'
  | 'address'
  | 'photos'
  | 'instructions'
  | 'availability';

type FieldErrors = Partial<Record<FieldName, string>>;

const useMocks =
  import.meta.env['VITE_USE_MOCKED_API_CALLS'] === 'true';

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
];

const ageOptions = [
  { value: 'any', label: 'Any' },
  { value: '0', label: 'Newborn' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '9', label: '9 months' },
  { value: '12', label: '1 year' },
  { value: '18', label: '18 months' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3 years' },
  { value: '48', label: '4 years' },
  { value: '60', label: '5 years' },
];

function normalizeAddress(address: AddressResponse): Address {
  return {
    id: String(address.id),
    nickname:
      address.nickname || address.nickanme || 'Saved address',
    city: address.city,
    state: address.state,
    isDefault: Boolean(address.isDefault),
  };
}

function getMockAddresses(): Address[] {
  const user = mockData.users[0];

  return mockData.addresses
    .filter((address) => address.user.id === user?.id)
    .map(normalizeAddress);
}

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(`Could not read ${file.name}.`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.readAsDataURL(file);
  });
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm text-red-600">
      {message}
    </p>
  );
}

export default function PostItemPage() {
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [addresses, setAddresses] = useState<Address[]>(() =>
    useMocks ? getMockAddresses() : []
  );

  const [addressId, setAddressId] = useState(() => {
    if (!useMocks) return '';

    return (
      getMockAddresses().find((address) => address.isDefault)?.id ??
      ''
    );
  });

  const [addressesLoading, setAddressesLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [ageFrom, setAgeFrom] = useState('any');
  const [ageTo, setAgeTo] = useState('any');
  const [photos, setPhotos] = useState<File[]>([]);
  const [instructions, setInstructions] = useState('');
  const [availability, setAvailability] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ageError =
    ageFrom !== 'any' &&
    ageTo !== 'any' &&
    Number(ageTo) < Number(ageFrom)
      ? 'The end age must be the same as or older than the start age'
      : '';

  async function loadAddresses() {
    setMessage('');
    setAddressesLoading(true);

    try {
      let savedAddresses: Address[];

      if (useMocks) {
        savedAddresses = getMockAddresses();
      } else {
        const baseUrl = (
          import.meta.env['VITE_API_BASE_URL'] ?? ''
        ).replace(/\/$/, '');

        const response = await fetch(`${baseUrl}/api/addresses`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Could not load saved addresses.');
        }

        const result = await response.json();

        if (!Array.isArray(result.data?.addresses)) {
          throw new Error('Unexpected address response.');
        }

        savedAddresses = result.data.addresses.map(normalizeAddress);
      }

      setAddresses(savedAddresses);

      if (!savedAddresses.some((address) => address.id === addressId)) {
        setAddressId(
          savedAddresses.find((address) => address.isDefault)?.id ?? ''
        );
      }

      if (savedAddresses.length === 0) {
        setMessage('You do not have any saved addresses yet.');
      }
    } catch {
      setMessage('Could not load saved addresses. Please try again.');
    } finally {
      setAddressesLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const nextErrors: FieldErrors = {};

    setMessage('');

    if (!title.trim()) {
      nextErrors.title = 'Enter an item title.';
    } else if (title.length > 80) {
      nextErrors.title = 'Title must be 80 characters or fewer.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Enter a description.';
    } else if (description.length > 1000) {
      nextErrors.description =
        'Description must be 1000 characters or fewer.';
    }

    const selectedCategory = categories.find(
      (item) => item.key === category
    );

    if (!selectedCategory) {
      nextErrors.category = 'Select a category.';
    }

    if (!conditions.some((item) => item.value === condition)) {
      nextErrors.condition = 'Select a condition.';
    }

    if (ageError) {
      nextErrors.ageTo = ageError;
    }

    const pickupAddress = addresses.find(
      (address) => address.id === addressId
    );

    if (!pickupAddress) {
      nextErrors.address = 'Select a pickup address.';
    }

    if (photos.length === 0) {
      nextErrors.photos = 'Add at least 1 photo.';
    } else if (photos.length > 6) {
      nextErrors.photos = 'You can add up to 6 photos';
    } else {
      const wrongType = photos.find(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      );

      const oversized = photos.find(
        (file) => file.size > 5 * 1024 * 1024
      );

      if (wrongType) {
        nextErrors.photos =
          `${wrongType.name} is not a jpg, png or webp image`;
      } else if (oversized) {
        nextErrors.photos = `${oversized.name} is larger than 5 MB`;
      }
    }

    if (instructions.length > 300) {
      nextErrors.instructions =
        'Pickup instructions must be 300 characters or fewer.';
    }

    if (availability.length > 200) {
      nextErrors.availability =
        'Availability must be 200 characters or fewer.';
    }

    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0];

    if (firstError) {
      form
        .querySelector<HTMLElement>(`#${firstError}`)
        ?.focus();
      return;
    }

    if (!pickupAddress || !selectedCategory) return;

    setIsSubmitting(true);

    try {
      if (!useMocks) {
        throw new Error(
          'Live posting is not connected yet. Enable mock mode to test posting.'
        );
      }

      const photoUrls = await Promise.all(photos.map(readPhoto));
      const id = crypto.randomUUID();

      const item = {
        id,
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        condition,
        childAgeMinMonths:
          ageFrom === 'any' ? null : Number(ageFrom),
        childAgeMaxMonths:
          ageTo === 'any' ? null : Number(ageTo),
        city: pickupAddress.city,
        state: pickupAddress.state,
        addressId,
        instructions: instructions.trim(),
        availability: availability.trim(),
        status: 'available',
        owner: mockData.users[0],
        photos: photoUrls.map((url, index) => ({
          url,
          altText: `${title.trim()} photo ${index + 1}`,
        })),
        coverPhoto: {
          url: photoUrls[0],
          altText: title.trim(),
        },
        createdAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(
          `hand-me-down:mock-item:${id}`,
          JSON.stringify(item)
        );

        sessionStorage.setItem(
          'hand-me-down:post-success',
          'Your item was posted'
        );
      } catch {
        throw new Error(
          'Browser storage could not save the test listing. Try fewer or smaller photos.'
        );
      }

      window.location.assign(`/items/${encodeURIComponent(id)}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Your form has been kept.`
          : 'Could not save your item. Your form has been kept.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Post an Item</h1>

      <p className="text-sm text-muted-foreground">
        Share baby gear with families in your community.
      </p>

      {useMocks && (
        <p className="text-sm text-muted-foreground">
          Test mode: listings are saved only in this browser tab.
        </p>
      )}

      {message && (
        <p
          role="alert"
          className="rounded-md border border-red-300 p-3 text-sm text-red-600"
        >
          {message}
        </p>
      )}

      <form
        className="space-y-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset
          disabled={isSubmitting}
          className="min-w-0 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter item title"
              maxLength={80}
              required
              aria-invalid={Boolean(errors.title)}
              aria-describedby="title-error"
            />
            <FieldError
              id="title-error"
              message={errors.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your item"
              maxLength={1000}
              required
              aria-invalid={Boolean(errors.description)}
              aria-describedby="description-error"
            />
            <FieldError
              id="description-error"
              message={errors.description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={
                isSubmitting ||
                categoriesLoading ||
                Boolean(categoriesError)
              }
              required
            >
              <SelectTrigger
                id="category"
                aria-invalid={Boolean(errors.category)}
                aria-describedby="category-error"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>

              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categoriesLoading && (
              <p role="status" className="text-sm">
                Loading categories…
              </p>
            )}

            {categoriesError && (
              <p role="alert" className="text-sm text-red-600">
                {categoriesError}
              </p>
            )}

            <FieldError
              id="category-error"
              message={errors.category}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition *</Label>
            <Select
              value={condition}
              onValueChange={setCondition}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger
                id="condition"
                aria-invalid={Boolean(errors.condition)}
                aria-describedby="condition-error"
              >
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>

              <SelectContent>
                {conditions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldError
              id="condition-error"
              message={errors.condition}
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              Age range (optional)
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ageFrom">From</Label>
                <Select
                  value={ageFrom}
                  onValueChange={setAgeFrom}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="ageFrom">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {ageOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageTo">To</Label>
                <Select
                  value={ageTo}
                  onValueChange={setAgeTo}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="ageTo"
                    aria-invalid={Boolean(ageError)}
                    aria-describedby="age-error"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {ageOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FieldError
                  id="age-error"
                  message={ageError}
                />
              </div>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="address">Pickup Address *</Label>

            <div>
              <Button
                type="button"
                variant="outline"
                onClick={loadAddresses}
                disabled={addressesLoading || isSubmitting}
              >
                {addressesLoading
                  ? 'Loading addresses…'
                  : 'Load Saved Addresses'}
              </Button>
            </div>

            <Select
              value={addressId}
              onValueChange={setAddressId}
              disabled={
                isSubmitting ||
                addressesLoading ||
                addresses.length === 0
              }
              required
            >
              <SelectTrigger
                id="address"
                aria-invalid={Boolean(errors.address)}
                aria-describedby="address-error address-privacy"
              >
                <SelectValue placeholder="Choose your address" />
              </SelectTrigger>

              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem
                    key={address.id}
                    value={address.id}
                  >
                    {address.nickname} — {address.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldError
              id="address-error"
              message={errors.address}
            />

            <p
              id="address-privacy"
              className="text-xs text-muted-foreground"
            >
              Only your city is shown publicly. Your address is shared
              only with the person you approve.
            </p>
          </div>

          <div className="space-y-2">
            <ItemPhotoPicker
              photos={photos}
              onChange={(selected) => {
                setPhotos(selected);

                setErrors((previous) => {
                  const next = { ...previous };
                  delete next.photos;
                  return next;
                });
              }}
            />

            <FieldError
              id="required-photos-error"
              message={errors.photos}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">
              Pickup Instructions
            </Label>
            <Textarea
              id="instructions"
              name="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={300}
              placeholder="Optional pickup instructions"
              aria-invalid={Boolean(errors.instructions)}
              aria-describedby="instructions-error"
            />
            <FieldError
              id="instructions-error"
              message={errors.instructions}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">
              Pickup Availability
            </Label>
            <Input
              id="availability"
              name="availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              maxLength={200}
              placeholder="Example: Weekdays after 5pm"
              aria-invalid={Boolean(errors.availability)}
              aria-describedby="availability-error"
            />
            <FieldError
              id="availability-error"
              message={errors.availability}
            />
          </div>
        </fieldset>

        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Posting…' : 'Post Item'}
        </Button>
      </form>
    </main>
  );
}
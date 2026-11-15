import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { useCategories } from '../hooks/useCategories';
import {
  createAddress,
  createItem,
  getAddresses,
  uploadPhoto,
} from '@/api/client';
import type { Address, NewAddress, NewItem } from '@/types';
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

const useMocks = import.meta.env['VITE_USE_MOCKED_API_CALLS'] === 'true';

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
];

const ages = [
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

type Errors = Record<string, string>;

type AddressDraft = {
  nickname: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const emptyAddress: AddressDraft = {
  nickname: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

const addressFields: {
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

function ErrorText({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-red-600">
      {message}
    </p>
  ) : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export default function PostItemPage() {
  const navigate = useNavigate();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [ageFrom, setAgeFrom] = useState('any');
  const [ageTo, setAgeTo] = useState('any');
  const [photos, setPhotos] = useState<File[]>([]);
  const [instructions, setInstructions] = useState('');
  const [availability, setAvailability] = useState('');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressLoadError, setAddressLoadError] = useState('');

  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>({
    ...emptyAddress,
  });
  const [addressErrors, setAddressErrors] = useState<Errors>({});
  const [addressSaveError, setAddressSaveError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const submitLock = useRef(false);
  const addressSaveLock = useRef(false);
  const uploadedPhotos = useRef(
    new WeakMap<File, { url: string; publicId: string }>(),
  );

  const busy = isSubmitting || savingAddress;

  const ageError =
    ageFrom !== 'any' && ageTo !== 'any' && Number(ageTo) < Number(ageFrom)
      ? 'The end age must be the same as or older than the start age'
      : '';

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getAddresses();

        if (active) {
          setAddresses(result);
          setAddressId(result.find((address) => address.isDefault)?.id ?? '');
        }
      } catch (error) {
        if (active) {
          setAddressLoadError(errorMessage(error));
        }
      } finally {
        if (active) {
          setAddressesLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (message) {
      messageRef.current?.focus();
    }
  }, [message]);

  async function retryAddresses() {
    setAddressesLoading(true);
    setAddressLoadError('');

    try {
      const result = await getAddresses();
      setAddresses(result);
      setAddressId((current) =>
        result.some((address) => address.id === current)
          ? current
          : (result.find((address) => address.isDefault)?.id ?? ''),
      );
    } catch (error) {
      setAddressLoadError(errorMessage(error));
    } finally {
      setAddressesLoading(false);
    }
  }

  function focusField(id: string) {
    formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
  }

  async function saveAddress() {
    if (addressSaveLock.current || submitLock.current) return;

    const next: Errors = {};

    for (const field of addressFields) {
      if (field.required && !addressDraft[field.key].trim()) {
        next[field.key] = `Enter your ${field.label.toLowerCase()}.`;
      }
    }

    setAddressErrors(next);
    setAddressSaveError('');

    const firstError = Object.keys(next)[0];

    if (firstError) {
      focusField(`new-${firstError}`);
      return;
    }

    addressSaveLock.current = true;
    setSavingAddress(true);

    try {
      const body: NewAddress = {
        nickname: addressDraft.nickname.trim(),
        line1: addressDraft.line1.trim(),
        line2: addressDraft.line2.trim(),
        city: addressDraft.city.trim(),
        state: addressDraft.state.trim(),
        postalCode: addressDraft.postalCode.trim(),
        country: 'US',
      };

      const saved = await createAddress(body);

      setAddresses((previous) => [
        ...previous.filter((address) => address.id !== saved.id),
        saved,
      ]);
      setAddressId(saved.id);
      setAddressDraft({ ...emptyAddress });
      setShowAddressEditor(false);
      setAddressLoadError('');
      setErrors((previous) => {
        const nextErrors = { ...previous };
        delete nextErrors['address'];
        return nextErrors;
      });
    } catch (error) {
      setAddressSaveError(errorMessage(error));
    } finally {
      addressSaveLock.current = false;
      setSavingAddress(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLock.current || addressSaveLock.current) return;

    setMessage('');

    if (showAddressEditor) {
      setMessage('Save or cancel the new address before posting.');
      return;
    }

    const next: Errors = {};

    if (!title.trim()) {
      next['title'] = 'Enter an item title.';
    } else if (title.length > 80) {
      next['title'] = 'Title must be 80 characters or fewer.';
    }

    if (!description.trim()) {
      next['description'] = 'Enter a description.';
    } else if (description.length > 1000) {
      next['description'] = 'Description must be 1000 characters or fewer.';
    }

    if (!categories.some((item) => item.key === category)) {
      next['category'] = 'Select a category.';
    }

    if (!conditions.some((item) => item.value === condition)) {
      next['condition'] = 'Select a condition.';
    }

    if (ageError) {
      next['ageTo'] = ageError;
    }

    if (!addresses.some((address) => address.id === addressId)) {
      next['address'] = 'Select a pickup address.';
    }

    if (photos.length === 0) {
      next['photos'] = 'Add at least 1 photo.';
    } else if (photos.length > 6) {
      next['photos'] = 'You can add up to 6 photos';
    } else {
      const wrongType = photos.find(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      );
      const oversized = photos.find((file) => file.size > 5 * 1024 * 1024);

      if (wrongType) {
        next['photos'] = `${wrongType.name} is not a jpg, png or webp image`;
      } else if (oversized) {
        next['photos'] = `${oversized.name} is larger than 5 MB`;
      }
    }

    if (instructions.length > 300) {
      next['instructions'] =
        'Pickup instructions must be 300 characters or fewer.';
    }

    if (availability.length > 200) {
      next['availability'] = 'Availability must be 200 characters or fewer.';
    }

    setErrors(next);

    const firstError = Object.keys(next)[0];

    if (firstError) {
      focusField(firstError);
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    try {
      const uploaded: NewItem['photos'] = [];

      for (const [index, file] of photos.entries()) {
        let photo = uploadedPhotos.current.get(file);

        if (!photo) {
          photo = await uploadPhoto(file);
          uploadedPhotos.current.set(file, photo);
        }

        uploaded.push({
          ...photo,
          altText: `${title.trim()} photo ${index + 1}`,
        });
      }

      const body: NewItem = {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        addressId,
        instructions: instructions.trim(),
        availability: availability.trim(),
        photos: uploaded,
        ...(ageFrom !== 'any' ? { childAgeMinMonths: Number(ageFrom) } : {}),
        ...(ageTo !== 'any' ? { childAgeMaxMonths: Number(ageTo) } : {}),
      };

      const saved = await createItem(body);

      navigate(`/items/${encodeURIComponent(saved.id)}`, {
        state: { message: 'Your item was posted' },
      });
    } catch (error) {
      setMessage(`${errorMessage(error)} Your form has been kept.`);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  function renderAgeSelect(
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Select value={value} onValueChange={onChange} disabled={busy}>
          <SelectTrigger
            id={id}
            className="w-full"
            aria-invalid={id === 'ageTo' && Boolean(ageError)}
            aria-describedby={id === 'ageTo' ? 'age-error' : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ages.map((age) => (
              <SelectItem key={age.value} value={age.value}>
                {age.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {id === 'ageTo' && <ErrorText id="age-error" message={ageError} />}
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Post an Item</h1>

      <p className="text-sm text-muted-foreground">
        Share baby gear with families in your community.
      </p>

      {useMocks && (
        <p className="text-sm text-muted-foreground">
          Development preview: using shared sample data. New listings and
          addresses reset when you refresh. Uploaded photos use sample images.
        </p>
      )}

      {message && (
        <p
          ref={messageRef}
          role="alert"
          tabIndex={-1}
          className="rounded-md border border-red-300 p-3 text-sm text-red-600"
        >
          {message}
        </p>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
        aria-busy={busy}
      >
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter item title"
              required
              maxLength={80}
              aria-invalid={Boolean(errors['title'])}
              aria-describedby="title-error"
            />
            <ErrorText id="title-error" message={errors['title']} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your item"
              required
              maxLength={1000}
              aria-invalid={Boolean(errors['description'])}
              aria-describedby="description-error"
            />
            <ErrorText id="description-error" message={errors['description']} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={busy || categoriesLoading || Boolean(categoriesError)}
              required
            >
              <SelectTrigger
                id="category"
                className="w-full"
                aria-invalid={Boolean(errors['category'])}
                aria-describedby="category-error category-load"
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
              <p id="category-load" role="status" className="text-sm">
                Loading categories…
              </p>
            )}
            <ErrorText id="category-load" message={categoriesError} />
            <ErrorText id="category-error" message={errors['category']} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition *</Label>
            <Select
              value={condition}
              onValueChange={setCondition}
              disabled={busy}
              required
            >
              <SelectTrigger
                id="condition"
                className="w-full"
                aria-invalid={Boolean(errors['condition'])}
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
            <ErrorText id="condition-error" message={errors['condition']} />
          </div>

          <fieldset className="min-w-0 space-y-3">
            <legend className="text-sm font-medium">
              Age range (optional)
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {renderAgeSelect('ageFrom', 'From', ageFrom, setAgeFrom)}
              {renderAgeSelect('ageTo', 'To', ageTo, setAgeTo)}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="address">Pickup Address *</Label>

            {addressesLoading && (
              <p role="status" className="text-sm">
                Loading addresses…
              </p>
            )}

            {addressLoadError && (
              <div className="space-y-2">
                <p role="alert" className="text-sm text-red-600">
                  {addressLoadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || addressesLoading}
                  onClick={() => void retryAddresses()}
                >
                  Retry loading addresses
                </Button>
              </div>
            )}

            {!addressesLoading &&
              !addressLoadError &&
              addresses.length === 0 && (
                <p className="text-sm">
                  You have no saved addresses. Add a pickup address below.
                </p>
              )}

            <Select
              value={addressId}
              onValueChange={setAddressId}
              disabled={busy || addressesLoading || addresses.length === 0}
              required
            >
              <SelectTrigger
                id="address"
                className="w-full"
                aria-invalid={Boolean(errors['address'])}
                aria-describedby="address-error address-privacy"
              >
                <SelectValue placeholder="Choose your address" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.nickname || 'Saved address'} — {address.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ErrorText id="address-error" message={errors['address']} />

            <p id="address-privacy" className="text-xs text-muted-foreground">
              Only your city is shown publicly. Your address is shared only with
              the person you approve.
            </p>

            {!showAddressEditor && (
              <Button
                type="button"
                variant="outline"
                disabled={busy || addressesLoading}
                onClick={() => {
                  setAddressErrors({});
                  setAddressSaveError('');
                  setShowAddressEditor(true);
                }}
              >
                Add new address
              </Button>
            )}
          </div>

          {showAddressEditor && (
            <fieldset className="min-w-0 space-y-4 rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">
                New pickup address
              </legend>

              {addressFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`new-${field.key}`}>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </Label>
                  <Input
                    id={`new-${field.key}`}
                    value={addressDraft[field.key]}
                    autoComplete={
                      field.key === 'line1'
                        ? 'address-line1'
                        : field.key === 'line2'
                          ? 'address-line2'
                          : field.key === 'city'
                            ? 'address-level2'
                            : field.key === 'state'
                              ? 'address-level1'
                              : field.key === 'postalCode'
                                ? 'postal-code'
                                : 'off'
                    }
                    required={field.required}
                    onChange={(event) =>
                      setAddressDraft((previous) => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(addressErrors[field.key])}
                    aria-describedby={`new-${field.key}-error`}
                  />
                  <ErrorText
                    id={`new-${field.key}-error`}
                    message={addressErrors[field.key]}
                  />
                </div>
              ))}

              <ErrorText id="address-save-error" message={addressSaveError} />

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => void saveAddress()}
                  disabled={busy}
                >
                  {savingAddress ? 'Saving…' : 'Save address'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setShowAddressEditor(false)}
                >
                  Cancel address
                </Button>
              </div>
            </fieldset>
          )}

          <div
            className="space-y-2"
            role="group"
            aria-label="Item photos"
            aria-describedby="required-photos-error"
            aria-invalid={Boolean(errors['photos'])}
          >
            <ItemPhotoPicker
              photos={photos}
              onChange={(selected) => {
                setPhotos(selected);
                setErrors((previous) => {
                  const next = { ...previous };
                  delete next['photos'];
                  return next;
                });
              }}
            />
            <ErrorText id="required-photos-error" message={errors['photos']} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Pickup Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={300}
              placeholder="Optional pickup instructions"
              aria-invalid={Boolean(errors['instructions'])}
              aria-describedby="instructions-error"
            />
            <ErrorText
              id="instructions-error"
              message={errors['instructions']}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Pickup Availability</Label>
            <Input
              id="availability"
              name="availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              maxLength={200}
              placeholder="Example: Weekdays after 5pm"
              aria-invalid={Boolean(errors['availability'])}
              aria-describedby="availability-error"
            />
            <ErrorText
              id="availability-error"
              message={errors['availability']}
            />
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={busy || addressesLoading || categoriesLoading}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Posting…' : 'Post Item'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}

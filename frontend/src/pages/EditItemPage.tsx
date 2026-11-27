import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Baby,
  ChevronLeft,
  ImageOff,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Tag,
  X,
} from 'lucide-react';
import {
  ApiRequestError,
  createAddress,
  getAddresses,
  getItem,
  updateItem,
  uploadPhoto,
} from '@/api/client';
import { AddressFields } from '@/components/item-form/AddressFields';
import ItemDetailsSkeleton from '@/components/ItemDetailsSkeleton';
import {
  FactList,
  FactRow,
  HeroBand,
  LocationAndDate,
  OwnerRow,
  PickupAreaCard,
  photoShapeClass,
} from '@/components/item-details/ItemDetailParts';
import {
  AgeSelect,
  CharCount,
  ErrorText,
  labelClass,
} from '@/components/item-form/ItemFormParts';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/useCategories';
import { emptyAddress } from '@/lib/addressForm';
import type { AddressDraft } from '@/lib/addressForm';
import { conditionBadges, conditions, limits, tints } from '@/lib/itemForm';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Address, ItemShow, ItemUpdate } from '@/types';

type Errors = Record<string, string>;

type PhotoEntry = {
  key: string;
  url: string;
  alt: string;
  id?: string;
  file?: File;
};

const NOT_FOUND = 404;
const MAX_RETRIES = 2;
const MAX_FILE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const pillSelectClass =
  'h-auto w-auto gap-1.5 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-2 dark:bg-transparent dark:hover:bg-transparent';

const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

const ageToText = (months: number | null): string =>
  months === null ? 'any' : String(months);

function EditItemForm({ item }: { item: ItemShow }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [initialPhotos] = useState<PhotoEntry[]>(() =>
    [...item.photos]
      .sort((a, b) => a.position - b.position)
      .map((photo) => ({
        key: photo.id,
        id: photo.id,
        url: photo.url,
        alt: photo.altText || item.title,
      })),
  );

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.category.key);
  const [condition, setCondition] = useState(item.condition);
  const [ageFrom, setAgeFrom] = useState(ageToText(item.childAgeMinMonths));
  const [ageTo, setAgeTo] = useState(ageToText(item.childAgeMaxMonths));
  const [photos, setPhotos] = useState<PhotoEntry[]>(initialPhotos);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });
  const [addressId, setAddressId] = useState('');
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);
  const [addressErrors, setAddressErrors] = useState<Errors>({});
  const [addressSaveError, setAddressSaveError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const chosenAddress = addresses.find((address) => address.id === addressId);
  // an item only exposes its city, state and postal code, so match on those
  const currentAddress = addresses.find(
    (address) =>
      address.city === item.city &&
      address.state === item.state &&
      address.postalCode === item.postalCode,
  );
  const addressChanged = addressId !== '' && addressId !== currentAddress?.id;

  const formRef = useRef<HTMLFormElement>(null);
  // Photos that already uploaded, so a retry does not upload them again.
  const uploadedPhotos = useRef(
    new Map<File, { url: string; publicId: string }>(),
  );

  const mainPhoto =
    photos.find((photo) => photo.key === selectedKey) ?? photos[0];

  const ageError =
    ageFrom !== 'any' && ageTo !== 'any' && Number(ageTo) < Number(ageFrom)
      ? 'The end age must be the same as or older than the start age'
      : '';

  const photosChanged =
    photos.map((photo) => photo.key).join(',') !==
    initialPhotos.map((photo) => photo.key).join(',');
  const hasChanges =
    photosChanged ||
    title !== item.title ||
    description !== item.description ||
    category !== item.category.key ||
    condition !== item.condition ||
    ageFrom !== ageToText(item.childAgeMinMonths) ||
    ageTo !== ageToText(item.childAgeMaxMonths) ||
    addressChanged;

  const clearError = (key: string) => {
    setErrors({ ...errors, [key]: '' });
  };

  const addFiles = (selected: File[]) => {
    if (selected.length === 0) return;

    if (photos.length + selected.length > limits.photos) {
      setErrors({
        ...errors,
        photos: `You can have up to ${limits.photos} photos`,
      });
      return;
    }

    const wrongType = selected.find(
      (file) => !ALLOWED_TYPES.includes(file.type),
    );
    const oversized = selected.find(
      (file) => file.size > MAX_FILE_MB * 1024 * 1024,
    );

    if (wrongType) {
      setErrors({
        ...errors,
        photos: `${wrongType.name} is not a jpg, png or webp image`,
      });
      return;
    }

    if (oversized) {
      setErrors({
        ...errors,
        photos: `${oversized.name} is larger than ${MAX_FILE_MB} MB`,
      });
      return;
    }

    clearError('photos');
    setPhotos([
      ...photos,
      ...selected.map((file) => ({
        key: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        alt: `${item.title} photo`,
      })),
    ]);
  };

  const removePhoto = (photo: PhotoEntry) => {
    if (photo.file) URL.revokeObjectURL(photo.url);

    setPhotos(photos.filter((entry) => entry.key !== photo.key));
    clearError('photos');
  };

  const makeCover = (photo: PhotoEntry) => {
    setPhotos([photo, ...photos.filter((entry) => entry.key !== photo.key)]);
    setSelectedKey(photo.key);
  };

  const collectErrors = (): Errors => {
    const next: Errors = {};

    if (photos.length === 0) {
      next['photos'] = 'Keep or add at least 1 photo.';
    }

    if (!title.trim()) {
      next['title'] = 'Enter an item title.';
    } else if (title.length > limits.title) {
      next['title'] = `Title must be ${limits.title} characters or fewer.`;
    }

    if (!categories.some((entry) => entry.key === category)) {
      next['category'] = 'Select a category.';
    }

    if (!conditions.some((entry) => entry.value === condition)) {
      next['condition'] = 'Select a condition.';
    }

    if (!description.trim()) {
      next['description'] = 'Enter a description.';
    } else if (description.length > limits.description) {
      next['description'] =
        `Description must be ${limits.description} characters or fewer.`;
    }

    if (ageError) {
      next['ageTo'] = ageError;
    }

    return next;
  };

  const saveAddress = async () => {
    const newErrors: Errors = {};

    if (!addressDraft.line1.trim()) {
      newErrors['line1'] = 'Enter your street address.';
    }
    if (!addressDraft.city.trim()) {
      newErrors['city'] = 'Enter your city.';
    }
    if (!addressDraft.state.trim()) {
      newErrors['state'] = 'Enter your state.';
    }
    if (!addressDraft.postalCode.trim()) {
      newErrors['postalCode'] = 'Enter your postal code.';
    }

    setAddressErrors(newErrors);
    setAddressSaveError('');

    if (Object.keys(newErrors).length > 0) return;

    setSavingAddress(true);

    try {
      const saved = await createAddress({
        nickname: addressDraft.nickname.trim(),
        line1: addressDraft.line1.trim(),
        line2: addressDraft.line2.trim(),
        city: addressDraft.city.trim(),
        state: addressDraft.state.trim(),
        postalCode: addressDraft.postalCode.trim(),
        country: 'US',
      });

      queryClient.setQueryData<Address[]>(['addresses'], [...addresses, saved]);
      setAddressId(saved.id);
      setAddressDraft(emptyAddress);
      setShowAddressEditor(false);
    } catch (error) {
      setAddressSaveError(errorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setMessage('');

    if (showAddressEditor) {
      setMessage('Save or cancel the new address before saving your changes.');
      return;
    }

    const next = collectErrors();

    setErrors(next);

    const firstError = Object.keys(next)[0];

    if (firstError) {
      formRef.current?.querySelector<HTMLElement>(`#${firstError}`)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const uploads = await Promise.all(
        photos.map(async (photo, index) => {
          if (!photo.file) return { id: photo.id! };

          let uploaded = uploadedPhotos.current.get(photo.file);

          if (!uploaded) {
            uploaded = await uploadPhoto(photo.file);
            uploadedPhotos.current.set(photo.file, uploaded);
          }

          return {
            ...uploaded,
            altText: `${title.trim()} photo ${index + 1}`,
          };
        }),
      );

      const body: ItemUpdate = {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        childAgeMinMonths: ageFrom !== 'any' ? Number(ageFrom) : null,
        childAgeMaxMonths: ageTo !== 'any' ? Number(ageTo) : null,
        photos: uploads,
      };

      if (addressChanged) {
        body.addressId = addressId;
      }

      await updateItem(item.id, body);
      await queryClient.invalidateQueries({ queryKey: ['item', item.id] });
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Your item was updated');
      navigate(`/items/${encodeURIComponent(item.id)}`);
    } catch (error) {
      setMessage(`${errorMessage(error)} Your changes have been kept.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pb-10">
      <form
        ref={formRef}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        aria-busy={isSubmitting}
      >
        <fieldset disabled={isSubmitting} className="min-w-0">
          <HeroBand>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/items/${item.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Back to item
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-sun/25 px-4 py-3 ring-1 ring-accent-sun/40">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-sun text-brown-900"
              >
                <Pencil className="size-[1.15rem]" />
              </span>
              <p className="leading-tight">
                <span className="block font-semibold">
                  You&apos;re editing your listing
                </span>
                <span className="block text-sm text-muted-foreground">
                  Changes show up once you save.
                </span>
              </p>
            </div>

            {message && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
              >
                {message}
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start xl:gap-14">
              <section
                aria-label="Item photos"
                className="@container relative mx-auto w-full max-w-2xl xl:max-w-none"
              >
                <div
                  className={cn(
                    'relative flex aspect-[4/3] items-center justify-center',
                    photoShapeClass,
                  )}
                >
                  {mainPhoto ? (
                    <img
                      src={mainPhoto.url}
                      alt={mainPhoto.alt}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <ImageOff className="size-16" aria-hidden="true" />
                      <p>Add at least one photo</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-3 p-1">
                  {photos.map((photo, index) => (
                    <div key={photo.key} className="relative">
                      <button
                        type="button"
                        onClick={() => setSelectedKey(photo.key)}
                        aria-label={`Show photo ${index + 1}`}
                        aria-pressed={photo.key === mainPhoto?.key}
                        className={cn(
                          'block size-16 overflow-hidden rounded-xl ring-1 ring-border transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none @md:size-[4.5rem]',
                          photo.key === mainPhoto?.key
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'opacity-70 hover:opacity-100',
                        )}
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="size-full object-cover"
                        />
                      </button>

                      <button
                        type="button"
                        aria-label={`Remove photo ${index + 1}`}
                        onClick={() => removePhoto(photo)}
                        className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        aria-label={
                          index === 0
                            ? 'Cover photo'
                            : `Make photo ${index + 1} the cover photo`
                        }
                        aria-pressed={index === 0}
                        title={index === 0 ? 'Cover photo' : 'Make cover'}
                        onClick={() => makeCover(photo)}
                        disabled={index === 0}
                        className={cn(
                          'absolute -bottom-2 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          index === 0
                            ? 'bg-foreground text-background'
                            : 'bg-card text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <Star
                          className={cn(
                            'size-3.5',
                            index === 0 && 'fill-current',
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  ))}

                  {photos.length < limits.photos && (
                    <div className="relative">
                      <input
                        id="photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="peer sr-only"
                        aria-label="Add photos"
                        onChange={(event) => {
                          const selected = Array.from(event.target.files ?? []);
                          // Clear the input so the same file can be chosen again.
                          event.target.value = '';
                          addFiles(selected);
                        }}
                      />
                      <label
                        htmlFor="photos"
                        className="flex size-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/70 text-muted-foreground transition hover:border-primary hover:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring @md:size-[4.5rem]"
                      >
                        <Plus className="size-6" aria-hidden="true" />
                        <span className="sr-only">Add photos</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <ErrorText id="photos-error" message={errors['photos']} />
                </div>
              </section>

              <div className="min-w-0 space-y-5">
                <div className="space-y-3">
                  <label htmlFor="title" className="sr-only">
                    Item title
                  </label>
                  <Textarea
                    id="title"
                    name="title"
                    value={title}
                    rows={1}
                    onChange={(event) => {
                      setTitle(event.target.value.replace('\n', ' '));
                      clearError('title');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.preventDefault();
                    }}
                    maxLength={limits.title}
                    aria-invalid={Boolean(errors['title'])}
                    aria-describedby="title-error"
                    className="font-display min-h-0 resize-none rounded-none border-0 border-b-2 border-border bg-transparent px-0 py-1 text-4xl leading-[1.1] font-bold tracking-tight shadow-none focus-visible:border-primary focus-visible:ring-0 md:text-5xl dark:bg-transparent"
                  />
                  <ErrorText id="title-error" message={errors['title']} />
                  <CharCount value={title} max={limits.title} />

                  <LocationAndDate
                    city={item.city}
                    state={item.state}
                    createdAt={item.createdAt}
                  />
                </div>

                <FactList>
                  <FactRow icon={Tag} label="Category" tint={tints.coral.solid}>
                    <Select
                      value={category}
                      onValueChange={(value) => {
                        setCategory(value);
                        clearError('category');
                      }}
                      disabled={categoriesLoading || Boolean(categoriesError)}
                    >
                      <SelectTrigger
                        id="category"
                        aria-label="Category"
                        aria-invalid={Boolean(errors['category'])}
                        className={pillSelectClass}
                      >
                        <SelectValue placeholder="Pick one" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((entry) => (
                          <SelectItem key={entry.key} value={entry.key}>
                            {entry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FactRow>

                  <FactRow
                    icon={Baby}
                    label="Child age"
                    tint={tints.blue.solid}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AgeSelect
                        className={pillSelectClass}
                        id="ageFrom"
                        label="Age from"
                        value={ageFrom}
                        onChange={(value) => {
                          setAgeFrom(value);
                          clearError('ageTo');
                        }}
                        disabled={isSubmitting}
                      />
                      <span className="text-muted-foreground">to</span>
                      <AgeSelect
                        className={pillSelectClass}
                        id="ageTo"
                        label="Age to"
                        value={ageTo}
                        onChange={(value) => {
                          setAgeTo(value);
                          clearError('ageTo');
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FactRow>

                  <FactRow
                    icon={Sparkles}
                    label="Condition"
                    badgeClassName={conditionBadges[condition]}
                  >
                    <Select
                      value={condition}
                      onValueChange={(value) => {
                        setCondition(value);
                        clearError('condition');
                      }}
                    >
                      <SelectTrigger
                        id="condition"
                        aria-label="Condition"
                        aria-invalid={Boolean(errors['condition'])}
                        className={pillSelectClass}
                      >
                        <SelectValue placeholder="Pick one">
                          {
                            conditions.find(
                              (entry) => entry.value === condition,
                            )?.label
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((entry) => (
                          <SelectItem key={entry.value} value={entry.value}>
                            {entry.label} · {entry.hint}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FactRow>
                </FactList>

                <div className="space-y-1">
                  <ErrorText id="category-error" message={errors['category']} />
                  <ErrorText
                    id="condition-error"
                    message={errors['condition']}
                  />
                  <ErrorText id="age-error" message={errors['ageTo']} />
                </div>

                <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border max-md:hidden">
                  <OwnerRow name={item.owner.name} />
                  <p
                    role="status"
                    className="text-center text-sm text-muted-foreground"
                  >
                    {hasChanges ? 'You have unsaved changes' : 'No changes yet'}
                  </p>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full text-base"
                    disabled={isSubmitting || categoriesLoading || !hasChanges}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-10 w-full rounded-full"
                  >
                    <Link to={`/items/${item.id}`}>Cancel</Link>
                  </Button>
                </div>
                <div className="md:hidden">
                  <OwnerRow name={item.owner.name} />
                </div>
              </div>
            </div>
          </HeroBand>

          <div className="mx-auto mt-10 grid max-w-6xl gap-y-3 px-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-x-14">
            <h2 className="text-2xl font-semibold md:col-start-1 md:row-start-1">
              <label htmlFor="description">
                <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
                  About this item
                </span>
              </label>
            </h2>
            <div className="space-y-3 md:col-start-1 md:row-start-2">
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  clearError('description');
                }}
                rows={6}
                maxLength={limits.description}
                aria-invalid={Boolean(errors['description'])}
                aria-describedby="description-error"
                className="min-h-40 rounded-2xl bg-card p-4 text-lg leading-8 md:text-lg"
              />
              <ErrorText
                id="description-error"
                message={errors['description']}
              />
              <CharCount value={description} max={limits.description} />
            </div>

            <PickupAreaCard
              city={chosenAddress?.city ?? item.city}
              state={chosenAddress?.state ?? item.state}
            >
              <div className="mt-4 space-y-3">
                <Label htmlFor="address" className={labelClass}>
                  Change pickup address
                </Label>
                <Select
                  value={addressId || currentAddress?.id || ''}
                  onValueChange={setAddressId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="address" className="w-full">
                    <SelectValue placeholder="Choose an address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {address.nickname || 'Saved address'} — {address.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {showAddressEditor ? (
                  <AddressFields
                    draft={addressDraft}
                    errors={addressErrors}
                    saveError={addressSaveError}
                    saving={savingAddress}
                    busy={isSubmitting || savingAddress}
                    onChange={(key, value) => {
                      setAddressDraft((previous) => ({
                        ...previous,
                        [key]: value,
                      }));
                      setAddressErrors({ ...addressErrors, [key]: '' });
                      setAddressSaveError('');
                    }}
                    onSave={() => void saveAddress()}
                    onCancel={() => setShowAddressEditor(false)}
                  />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      setAddressErrors({});
                      setAddressSaveError('');
                      setShowAddressEditor(true);
                    }}
                  >
                    <Plus />
                    Add new address
                  </Button>
                )}

                <p className="text-sm text-muted-foreground">
                  Pickup notes and times can&apos;t be edited here yet.
                </p>
              </div>
            </PickupAreaCard>
          </div>
        </fieldset>

        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-6 px-4 md:hidden">
          <div className="flex gap-3 rounded-3xl bg-background/95 p-3 shadow-lg ring-1 ring-border backdrop-blur">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full px-5 text-base"
            >
              <Link to={`/items/${item.id}`}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1 rounded-full text-base"
              disabled={isSubmitting || categoriesLoading || !hasChanges}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const {
    data: item,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<ItemShow>({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: Boolean(id),
    retry: (failureCount, queryError) => {
      if (
        queryError instanceof ApiRequestError &&
        queryError.status === NOT_FOUND
      ) {
        return false;
      }

      return failureCount < MAX_RETRIES;
    },
  });

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (isPending) {
    return <ItemDetailsSkeleton />;
  }

  if (isError) {
    if (error instanceof ApiRequestError && error.status === NOT_FOUND) {
      return (
        <main className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h1 className="text-3xl font-bold">Item not found</h1>
          <Link to="/" className="mt-6 inline-block text-primary underline">
            Go to Home page
          </Link>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage
          message="Unable to load item details. Please try again."
          onRetry={() => {
            void refetch();
          }}
        />
      </main>
    );
  }

  if (currentUserId !== item.owner.id) {
    return <Navigate to={`/items/${id}`} replace />;
  }

  return <EditItemForm key={item.id} item={item} />;
}

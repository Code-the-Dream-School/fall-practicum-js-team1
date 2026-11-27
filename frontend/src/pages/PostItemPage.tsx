import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Check, MapPin, PenLine, ShieldCheck } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import {
  createAddress,
  createItem,
  getAddresses,
  uploadPhoto,
} from '@/api/client';
import type { Address, NewAddress, NewItem } from '@/types';
import ItemPhotoPicker from '../components/ItemPhotoPicker';
import type { PhotoUploadState } from '../components/ItemPhotoPicker';
import { cn } from '@/lib/utils';
import { conditions, limits, tints } from '@/lib/itemForm';
import { PageBackdrop } from '@/components/item-details/ItemDetailParts';
import {
  AgeRangeFields,
  CharCount,
  ConditionPicker,
  ErrorText,
  FieldHint,
  FormSection,
  fieldClass,
  labelClass,
  textareaClass,
} from '@/components/item-form/ItemFormParts';
import { AddressFields } from '@/components/item-form/AddressFields';
import { emptyAddress, validateAddress } from '@/lib/addressForm';
import type { AddressDraft } from '@/lib/addressForm';
import { ItemCard } from '@/components/ui/ItemCard';
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

type Errors = Record<string, string>;

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

const stepTints = [tints.coral.solid, tints.blue.solid, tints.sage.solid];

function StepIndicator({
  labels,
  current,
  onGo,
}: {
  labels: string[];
  current: number;
  onGo: (step: number) => void;
}) {
  return (
    <nav aria-label="Posting steps">
      <ol className="flex items-center gap-2 sm:gap-3">
        {labels.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const last = index === labels.length - 1;

          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-2 sm:gap-3',
                !last && 'flex-1',
              )}
            >
              <button
                type="button"
                disabled={!done}
                onClick={() => onGo(index)}
                aria-current={active ? 'step' : undefined}
                className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default"
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                    done && 'text-white',
                    active && 'text-white ring-4 ring-ring/30',
                    (done || active) && stepTints[index],
                    !done && !active && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-px flex-1 transition-colors',
                    done ? stepTints[index] : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const stepLabels = ['Photos', 'Details', 'Pickup'];

export default function PostItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  // Changing this number runs the address-loading effect again (Retry button).
  const [addressLoadAttempt, setAddressLoadAttempt] = useState(0);

  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);
  const [addressErrors, setAddressErrors] = useState<Errors>({});
  const [addressSaveError, setAddressSaveError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [uploadStates, setUploadStates] = useState<Map<File, PhotoUploadState>>(
    new Map(),
  );
  const [coverUrl, setCoverUrl] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  // Field to focus after the step changes (the field is not on screen yet).
  const pendingFocus = useRef('');
  const uploadController = useRef<AbortController | null>(null);
  // Photos that already uploaded, so a retry does not upload them again.
  const uploadedPhotos = useRef(
    new Map<File, { url: string; publicId: string }>(),
  );

  const busy = isSubmitting || savingAddress || isRetrying;

  const ageError =
    ageFrom !== 'any' && ageTo !== 'any' && Number(ageTo) < Number(ageFrom)
      ? 'The end age must be the same as or older than the start age'
      : '';

  const selectedAddress = addresses.find((address) => address.id === addressId);

  const previewItem = {
    id: 'preview',
    title: title.trim() || 'Your item title',
    condition:
      conditions.find((item) => item.value === condition)?.value ?? 'good',
    status: 'available' as const,
    childAgeMinMonths: ageFrom !== 'any' ? Number(ageFrom) : null,
    childAgeMaxMonths: ageTo !== 'any' ? Number(ageTo) : null,
    city: selectedAddress?.city ?? 'Your city',
    coverPhoto: coverUrl
      ? { url: coverUrl, altText: 'Cover photo preview' }
      : null,
  };

  const focusField = (id: string) => {
    formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
  };

  const clearError = (key: string) => {
    setErrors({ ...errors, [key]: '' });
  };

  // Cancel any upload that is still running when the page closes.
  useEffect(() => {
    return () => uploadController.current?.abort();
  }, []);

  // Make a preview image URL for the first photo.
  const coverFile = photos[0];

  useEffect(() => {
    if (!coverFile) {
      setCoverUrl('');
      return;
    }

    const url = URL.createObjectURL(coverFile);
    setCoverUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const result = await getAddresses();
        const defaultAddress = result.find((address) => address.isDefault);

        setAddresses(result);
        // Keep the current choice if it still exists, otherwise use the default.
        setAddressId((current) => {
          if (result.some((address) => address.id === current)) {
            return current;
          }
          return defaultAddress?.id ?? '';
        });
      } catch (error) {
        setAddressLoadError(errorMessage(error));
      } finally {
        setAddressesLoading(false);
      }
    };

    void loadAddresses();
  }, [addressLoadAttempt]);

  useEffect(() => {
    window.scrollTo({ top: 0 });

    if (pendingFocus.current) {
      const key = pendingFocus.current;
      pendingFocus.current = '';
      requestAnimationFrame(() => focusField(key));
    }
  }, [step]);

  useEffect(() => {
    if (message) {
      messageRef.current?.focus();
    }
  }, [message]);

  const retryAddresses = () => {
    setAddressesLoading(true);
    setAddressLoadError('');
    setAddressLoadAttempt(addressLoadAttempt + 1);
  };

  const updateUpload = (file: File, state: PhotoUploadState) => {
    setUploadStates((previous) => new Map(previous).set(file, state));
  };

  // Uploads one photo. Returns undefined when it fails or is cancelled.
  const uploadFile = async (file: File, signal: AbortSignal) => {
    const alreadyUploaded = uploadedPhotos.current.get(file);

    if (alreadyUploaded) {
      updateUpload(file, { status: 'uploaded' });
      return alreadyUploaded;
    }

    updateUpload(file, { status: 'uploading' });

    try {
      const photo = await uploadPhoto(
        file,
        (progress) => {
          if (!signal.aborted) {
            updateUpload(file, { status: 'uploading', progress });
          }
        },
        signal,
      );

      if (signal.aborted) return undefined;

      uploadedPhotos.current.set(file, photo);
      updateUpload(file, { status: 'uploaded' });
      return photo;
    } catch (error) {
      if (!signal.aborted) {
        updateUpload(file, { status: 'failed', message: errorMessage(error) });
      }

      return undefined;
    }
  };

  const retryPhoto = async (file: File) => {
    if (busy || !photos.includes(file)) return;

    setIsRetrying(true);
    setMessage('');

    const controller = new AbortController();
    uploadController.current = controller;

    const photo = await uploadFile(file, controller.signal);

    if (!controller.signal.aborted) {
      if (photo) {
        setMessage('');
      } else {
        setMessage(
          'The photo could not be uploaded. Use Retry or remove it. Your form has been kept.',
        );
      }
    }

    setIsRetrying(false);
  };

  const saveAddress = async () => {
    if (busy) return;

    const newErrors = validateAddress(addressDraft);

    setAddressErrors(newErrors);
    setAddressSaveError('');

    const firstError = Object.keys(newErrors)[0];

    if (firstError) {
      focusField(`new-${firstError}`);
      return;
    }

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

      setAddresses([...addresses, saved]);
      setAddressId(saved.id);
      setAddressDraft(emptyAddress);
      setShowAddressEditor(false);
      setAddressLoadError('');
      clearError('address');
    } catch (error) {
      setAddressSaveError(errorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

  // Each step has its own validation, so "Next" only checks the current step.
  const validatePhotos = () => {
    const newErrors: Errors = {};
    const wrongType = photos.find(
      (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    );
    const oversized = photos.find((file) => file.size > 5 * 1024 * 1024);

    if (photos.length === 0) {
      newErrors['photos'] = 'Add at least 1 photo.';
    } else if (photos.length > limits.photos) {
      newErrors['photos'] = `You can add up to ${limits.photos} photos`;
    } else if (wrongType) {
      newErrors['photos'] = `${wrongType.name} is not a jpg, png or webp image`;
    } else if (oversized) {
      newErrors['photos'] = `${oversized.name} is larger than 5 MB`;
    }

    return newErrors;
  };

  const validateDetails = () => {
    const newErrors: Errors = {};

    if (!title.trim()) {
      newErrors['title'] = 'Enter an item title.';
    } else if (title.length > limits.title) {
      newErrors['title'] = `Title must be ${limits.title} characters or fewer.`;
    }

    if (!categories.some((item) => item.key === category)) {
      newErrors['category'] = 'Select a category.';
    }

    if (!conditions.some((item) => item.value === condition)) {
      newErrors['condition'] = 'Select a condition.';
    }

    if (!description.trim()) {
      newErrors['description'] = 'Enter a description.';
    } else if (description.length > limits.description) {
      newErrors['description'] =
        `Description must be ${limits.description} characters or fewer.`;
    }

    if (ageError) {
      newErrors['ageTo'] = ageError;
    }

    return newErrors;
  };

  const validatePickup = () => {
    const newErrors: Errors = {};

    if (!addresses.some((address) => address.id === addressId)) {
      newErrors['address'] = 'Select a pickup address.';
    }

    if (instructions.length > limits.instructions) {
      newErrors['instructions'] =
        `Pickup instructions must be ${limits.instructions} characters or fewer.`;
    }

    if (availability.length > limits.availability) {
      newErrors['availability'] =
        `Availability must be ${limits.availability} characters or fewer.`;
    }

    return newErrors;
  };

  const handleNext = () => {
    if (showAddressEditor) {
      setMessage('Save or cancel the new address before continuing.');
      return;
    }

    setMessage('');

    let stepErrors: Errors = {};

    if (step === 0) {
      stepErrors = validatePhotos();
    }
    if (step === 1) {
      stepErrors = validateDetails();
    }

    setErrors(stepErrors);

    const firstError = Object.keys(stepErrors)[0];

    if (firstError) {
      focusField(firstError);
      return;
    }

    setStep(step + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Next/Post share one form
    if (step < stepLabels.length - 1) {
      handleNext();
      return;
    }

    if (busy) return;

    setMessage('');

    if (showAddressEditor) {
      setMessage('Save or cancel the new address before posting.');
      return;
    }

    const photoErrors = validatePhotos();
    const detailErrors = validateDetails();
    const pickupErrors = validatePickup();
    const allErrors = { ...photoErrors, ...detailErrors, ...pickupErrors };

    setErrors(allErrors);

    const firstError = Object.keys(allErrors)[0];

    if (firstError) {
      // Go back to the step that has the first error, then focus the field.
      let errorStep = 2;
      if (Object.keys(photoErrors).length > 0) {
        errorStep = 0;
      } else if (Object.keys(detailErrors).length > 0) {
        errorStep = 1;
      }

      if (errorStep === step) {
        focusField(firstError);
      } else {
        pendingFocus.current = firstError;
        setStep(errorStep);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const uploaded: NewItem['photos'] = [];
      const controller = new AbortController();
      uploadController.current = controller;
      let uploadFailed = false;

      // Photos upload one at a time; ones that worked are reused on retry.
      for (const [index, file] of photos.entries()) {
        if (controller.signal.aborted) return;

        const photo = await uploadFile(file, controller.signal);

        if (photo) {
          uploaded.push({
            ...photo,
            altText: `${title.trim()} photo ${index + 1}`,
          });
        } else {
          uploadFailed = true;
        }
      }

      if (controller.signal.aborted) return;

      if (uploadFailed) {
        setStep(0);
        setMessage(
          'Some photos could not be uploaded. Use Retry on each failed photo or remove it. Your form has been kept.',
        );
        return;
      }

      const body: NewItem = {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        addressId,
        photos: uploaded,
      };

      if (instructions.trim()) {
        body.instructions = instructions.trim();
      }
      if (availability.trim()) {
        body.availability = availability.trim();
      }
      if (ageFrom !== 'any') {
        body.childAgeMinMonths = Number(ageFrom);
      }
      if (ageTo !== 'any') {
        body.childAgeMaxMonths = Number(ageTo);
      }

      const saved = await createItem(body);

      // Refresh all item lists when Home mounts, including cached filter results.
      void queryClient.invalidateQueries({
        queryKey: ['items'],
        refetchType: 'none',
      });

      toast.success('Your item was posted');
      navigate(`/items/${encodeURIComponent(saved.id)}`);
    } catch (error) {
      setMessage(`${errorMessage(error)} Your form has been kept.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = step === stepLabels.length - 1;

  return (
    <PageBackdrop variant="blocks">
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <header className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Post an{' '}
                <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
                  item
                </span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Outgrown something your little one loved? Pass it on to a family
                nearby. It only takes a couple of minutes.
              </p>
            </header>

            <div className="lg:w-[calc(100%-24.5rem)]">
              <StepIndicator
                labels={stepLabels}
                current={step}
                onGo={(target) => {
                  setMessage('');
                  setStep(target);
                }}
              />
            </div>
          </div>

          <div className="min-w-0 lg:col-start-1">
            {useMocks && (
              <p className="mb-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                Development preview: using shared sample data. New listings and
                addresses reset when you refresh. Uploaded photos use sample
                images.
              </p>
            )}

            {message && (
              <p
                ref={messageRef}
                role="alert"
                tabIndex={-1}
                className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
              >
                {message}
              </p>
            )}

            <form
              ref={formRef}
              onSubmit={(event) => void handleSubmit(event)}
              noValidate
              aria-busy={busy}
            >
              <fieldset disabled={busy} className="min-w-0">
                {step === 0 && (
                  <FormSection
                    title="Add photos *"
                    hint="Clear, bright photos get claimed faster."
                    icon={Camera}
                    tint={tints.coral}
                  >
                    <div
                      className="space-y-2"
                      role="group"
                      aria-label="Item photos"
                      aria-describedby="required-photos-error"
                      aria-invalid={Boolean(errors['photos'])}
                    >
                      <ItemPhotoPicker
                        photos={photos}
                        uploadStates={uploadStates}
                        disabled={busy}
                        onRetry={(file) => void retryPhoto(file)}
                        onChange={(selected) => {
                          setPhotos(selected);
                          clearError('photos');
                        }}
                      />
                      <ErrorText
                        id="required-photos-error"
                        message={errors['photos']}
                      />
                    </div>
                  </FormSection>
                )}

                {step === 1 && (
                  <FormSection
                    title="Details"
                    hint="Tell the next family what they're getting."
                    icon={PenLine}
                    tint={tints.blue}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="title" className={labelClass}>
                        Item title *
                      </Label>
                      <FieldHint>
                        Name it the way a parent would search for it.
                      </FieldHint>
                      <Input
                        id="title"
                        className={fieldClass}
                        name="title"
                        value={title}
                        onChange={(event) => {
                          setTitle(event.target.value);
                          clearError('title');
                        }}
                        placeholder="e.g. Graco convertible car seat"
                        required
                        maxLength={limits.title}
                        aria-invalid={Boolean(errors['title'])}
                        aria-describedby="title-error"
                      />
                      <ErrorText id="title-error" message={errors['title']} />
                      <CharCount value={title} max={limits.title} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className={labelClass}>
                        Category *
                      </Label>
                      <Select
                        value={category}
                        onValueChange={(value) => {
                          setCategory(value);
                          clearError('category');
                        }}
                        disabled={
                          busy || categoriesLoading || Boolean(categoriesError)
                        }
                        required
                      >
                        <SelectTrigger
                          id="category"
                          className={cn(fieldClass, 'w-full')}
                          aria-invalid={Boolean(errors['category'])}
                          aria-describedby="category-error category-load"
                        >
                          <SelectValue placeholder="Pick a category" />
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
                        <p
                          id="category-load"
                          role="status"
                          className="text-sm text-muted-foreground"
                        >
                          Loading categories…
                        </p>
                      )}
                      <ErrorText id="category-load" message={categoriesError} />
                      <ErrorText
                        id="category-error"
                        message={errors['category']}
                      />
                    </div>

                    <ConditionPicker
                      value={condition}
                      error={errors['condition']}
                      onChange={(value) => {
                        setCondition(value);
                        clearError('condition');
                      }}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="description" className={labelClass}>
                        Description *
                      </Label>
                      <FieldHint>
                        Brand, size, how it was used, anything worth knowing.
                      </FieldHint>
                      <Textarea
                        id="description"
                        className={textareaClass}
                        name="description"
                        value={description}
                        onChange={(event) => {
                          setDescription(event.target.value);
                          clearError('description');
                        }}
                        placeholder="e.g. Used for one child, smoke-free home, all straps included"
                        required
                        rows={4}
                        maxLength={limits.description}
                        aria-invalid={Boolean(errors['description'])}
                        aria-describedby="description-error"
                      />
                      <ErrorText
                        id="description-error"
                        message={errors['description']}
                      />
                      <CharCount value={description} max={limits.description} />
                    </div>

                    <AgeRangeFields
                      ageFrom={ageFrom}
                      ageTo={ageTo}
                      onFromChange={setAgeFrom}
                      onToChange={setAgeTo}
                      disabled={busy}
                      error={ageError}
                    />
                  </FormSection>
                )}

                {step === 2 && (
                  <FormSection
                    title="Pickup"
                    hint="Where and when someone can collect it."
                    icon={MapPin}
                    tint={tints.sage}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="address" className={labelClass}>
                        Pickup address *
                      </Label>

                      {addressesLoading && (
                        <p
                          role="status"
                          className="text-sm text-muted-foreground"
                        >
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
                            onClick={retryAddresses}
                          >
                            Retry loading addresses
                          </Button>
                        </div>
                      )}

                      {!addressesLoading &&
                        !addressLoadError &&
                        addresses.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            You have no saved addresses. Add a pickup address
                            below.
                          </p>
                        )}

                      <Select
                        value={addressId}
                        onValueChange={(value) => {
                          setAddressId(value);
                          clearError('address');
                        }}
                        disabled={
                          busy || addressesLoading || addresses.length === 0
                        }
                        required
                      >
                        <SelectTrigger
                          id="address"
                          className={cn(fieldClass, 'w-full')}
                          aria-invalid={Boolean(errors['address'])}
                          aria-describedby="address-error address-privacy"
                        >
                          <SelectValue placeholder="Choose your address" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {address.nickname || 'Saved address'} —{' '}
                              {address.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <ErrorText
                        id="address-error"
                        message={errors['address']}
                      />

                      <p
                        id="address-privacy"
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <ShieldCheck
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        Only your city is public. Your address is shared with
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
                      <AddressFields
                        draft={addressDraft}
                        errors={addressErrors}
                        saveError={addressSaveError}
                        saving={savingAddress}
                        busy={busy}
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
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="availability" className={labelClass}>
                        When can people pick up? (optional)
                      </Label>
                      <Input
                        id="availability"
                        className={fieldClass}
                        name="availability"
                        value={availability}
                        onChange={(event) => {
                          setAvailability(event.target.value);
                          clearError('availability');
                        }}
                        maxLength={limits.availability}
                        placeholder="e.g. Weekdays after 5pm"
                        aria-invalid={Boolean(errors['availability'])}
                        aria-describedby="availability-error"
                      />
                      <ErrorText
                        id="availability-error"
                        message={errors['availability']}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions" className={labelClass}>
                        Pickup notes (optional)
                      </Label>
                      <Textarea
                        id="instructions"
                        className={textareaClass}
                        name="instructions"
                        value={instructions}
                        onChange={(event) => {
                          setInstructions(event.target.value);
                          clearError('instructions');
                        }}
                        maxLength={limits.instructions}
                        rows={3}
                        placeholder="e.g. Porch pickup, ring the bell twice"
                        aria-invalid={Boolean(errors['instructions'])}
                        aria-describedby="instructions-error"
                      />
                      <ErrorText
                        id="instructions-error"
                        message={errors['instructions']}
                      />
                      <CharCount
                        value={instructions}
                        max={limits.instructions}
                      />
                    </div>
                  </FormSection>
                )}
              </fieldset>

              <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-6 md:bottom-4">
                <div className="flex gap-3 rounded-2xl bg-background/95 p-3 shadow-lg ring-1 ring-border backdrop-blur">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-5 text-base"
                    disabled={busy}
                    onClick={() => {
                      if (step === 0) {
                        navigate('/');
                        return;
                      }

                      setMessage('');
                      setStep(step - 1);
                    }}
                  >
                    {step === 0 ? 'Cancel' : 'Back'}
                  </Button>
                  {isLastStep ? (
                    <Button
                      type="submit"
                      className="h-12 flex-1 text-base"
                      disabled={busy || addressesLoading || categoriesLoading}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? 'Posting…' : 'Post item'}
                    </Button>
                  ) : (
                    <Button type="submit" className="h-12 flex-1 text-base">
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <aside className="hidden lg:col-start-2 lg:row-start-2 lg:block">
            <div className="sticky top-24 space-y-3">
              <div>
                <h2 className="text-lg font-semibold">How it will look</h2>
                <p className="text-sm text-muted-foreground">
                  This is the card people see on the home page.
                </p>
              </div>
              <div className="relative pt-3">
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-accent-sun/60 shadow-sm"
                />
                <div
                  inert
                  aria-hidden="true"
                  className="rounded-3xl shadow-[8px_8px_0_0_color-mix(in_oklab,var(--color-accent-blue)_35%,transparent)] select-none"
                >
                  <ItemCard item={previewItem} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </PageBackdrop>
  );
}

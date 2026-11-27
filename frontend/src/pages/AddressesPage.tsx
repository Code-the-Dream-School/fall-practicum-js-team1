import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Pencil, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '@/api/client';
import { AddressFields } from '@/components/item-form/AddressFields';
import { PageBackdrop } from '@/components/item-details/ItemDetailParts';
import { ConfirmButton } from '@/components/profile/ConfirmButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { emptyAddress, validateAddress } from '@/lib/addressForm';
import type { AddressDraft } from '@/lib/addressForm';
import { tints } from '@/lib/itemForm';
import { cn } from '@/lib/utils';
import type { Address } from '@/types';

type Errors = Record<string, string>;

const addressToDraft = (address: Address): AddressDraft => ({
  nickname: address.nickname,
  line1: address.line1,
  line2: address.line2 ?? '',
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
});

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

export default function AddressesPage() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  // The address being edited. null means the dialog is adding a new one.
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(emptyAddress);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');

  const {
    data: addresses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['addresses'], queryFn: getAddresses });

  // Every successful change shows a toast and reloads the list
  const refresh = (message: string) => {
    toast.success(message);
    void queryClient.invalidateQueries({ queryKey: ['addresses'] });
  };

  const showError = (error: unknown) => toast.error(getErrorMessage(error));

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        nickname: draft.nickname.trim(),
        line1: draft.line1.trim(),
        line2: draft.line2.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        postalCode: draft.postalCode.trim(),
      };

      if (editingAddress) {
        return updateAddress(editingAddress.id, body);
      }
      return createAddress({ ...body, country: 'US' });
    },
    onSuccess: () => {
      refresh(editingAddress ? 'Address updated' : 'Address added');
      setDialogOpen(false);
    },
    onError: (error) => setSaveError(getErrorMessage(error)),
  });

  const makeDefaultMutation = useMutation({
    mutationFn: (id: string) => updateAddress(id, { isDefault: true }),
    onSuccess: () => refresh('Default address changed'),
    onError: showError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => refresh('Address deleted'),
    onError: showError,
  });

  // Pass an address to edit it, or null to add a new one
  const openDialog = (address: Address | null) => {
    setEditingAddress(address);
    setDraft(address ? addressToDraft(address) : emptyAddress);
    setErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const handleChange = (key: keyof AddressDraft, value: string) => {
    setDraft({ ...draft, [key]: value });
    setErrors({ ...errors, [key]: '' });
    setSaveError('');
  };

  const handleSave = () => {
    const newErrors = validateAddress(draft);

    setErrors(newErrors);
    setSaveError('');

    if (Object.keys(newErrors).length === 0) {
      saveMutation.mutate();
    }
  };

  let content;

  if (isLoading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
        {[1, 2].map((number) => (
          <Skeleton key={number} className="h-48 rounded-3xl" />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <ErrorMessage
        message="Unable to load your addresses. Please try again."
        onRetry={() => void refetch()}
      />
    );
  } else if (addresses.length === 0) {
    content = (
      <EmptyState
        title="No saved addresses yet"
        message="Add a pickup address so you can post an item."
        action={{ label: 'Add address', onClick: () => openDialog(null) }}
      />
    );
  } else {
    content = (
      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-2xl text-white',
                  tints.sage.solid,
                )}
              >
                <MapPin className="size-5" />
              </span>

              <div className="min-w-0 flex-1 leading-snug">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {address.nickname || 'Saved address'}
                  </h2>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-sun/25 px-2.5 py-0.5 text-xs font-semibold">
                      <Star
                        className="size-3 fill-current"
                        aria-hidden="true"
                      />
                      Default
                    </span>
                  )}
                </div>

                <address className="mt-1 text-muted-foreground not-italic">
                  {address.line1}
                  {address.line2 && <>, {address.line2}</>}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                </address>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-dashed border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDialog(address)}
              >
                <Pencil />
                Edit
              </Button>

              {!address.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={makeDefaultMutation.isPending}
                  onClick={() => makeDefaultMutation.mutate(address.id)}
                >
                  <Star />
                  Make default
                </Button>
              )}

              <ConfirmButton
                label="Delete"
                title="Delete this address?"
                description="This removes the address from your account. You can't undo this."
                confirmLabel="Delete address"
                className="ml-auto text-destructive"
                onConfirm={() => deleteMutation.mutate(address.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <PageBackdrop variant="leaves" className="min-h-[calc(100svh-9rem)]">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back to profile
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                My{' '}
                <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
                  addresses
                </span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Where people can pick up your items. Only your city is ever
                public. Your street address is shared with the person you
                approve.
              </p>
            </div>

            <Button
              className="h-11 rounded-full px-5"
              onClick={() => openDialog(null)}
            >
              <Plus />
              Add address
            </Button>
          </div>
        </div>

        {content}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !saveMutation.isPending) setDialogOpen(false);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit address' : 'Add an address'}
            </DialogTitle>
            <DialogDescription>
              Only the city is shown on your listings.
            </DialogDescription>
          </DialogHeader>

          <AddressFields
            legend="Address details"
            saveLabel={editingAddress ? 'Save changes' : 'Add address'}
            cancelLabel="Cancel"
            draft={draft}
            errors={errors}
            saveError={saveError}
            saving={saveMutation.isPending}
            busy={saveMutation.isPending}
            onChange={handleChange}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </PageBackdrop>
  );
}

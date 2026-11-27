import { ErrorText, fieldClass } from '@/components/item-form/ItemFormParts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AddressDraft } from '@/lib/addressForm';
import { usStates } from '@/lib/usStates';

type Props = {
  draft: AddressDraft;
  errors: Record<string, string>;
  saveError: string;
  saving: boolean;
  busy: boolean;
  onChange: (key: keyof AddressDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  legend?: string;
  saveLabel?: string;
  cancelLabel?: string;
};

const addressFields: {
  key: keyof AddressDraft;
  label: string;
  required: boolean;
  autoComplete: string;
}[] = [
  { key: 'nickname', label: 'Nickname', required: false, autoComplete: 'off' },
  {
    key: 'line1',
    label: 'Street address',
    required: true,
    autoComplete: 'address-line1',
  },
  {
    key: 'line2',
    label: 'Apartment or unit',
    required: false,
    autoComplete: 'address-line2',
  },
  {
    key: 'city',
    label: 'City',
    required: true,
    autoComplete: 'address-level2',
  },
  { key: 'state', label: 'State', required: true, autoComplete: 'off' },
  {
    key: 'postalCode',
    label: 'Postal code',
    required: true,
    autoComplete: 'postal-code',
  },
];

export function AddressFields({
  draft,
  errors,
  saveError,
  saving,
  busy,
  onChange,
  legend = 'New pickup address',
  saveLabel = 'Save address',
  cancelLabel = 'Cancel address',
  onSave,
  onCancel,
}: Props) {
  return (
    <fieldset className="min-w-0 space-y-4 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">{legend}</legend>

      {addressFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`new-${field.key}`} className="text-sm">
            {field.label}
            {field.required ? ' *' : ''}
          </Label>
          {field.key === 'state' ? (
            <Select
              value={draft.state}
              onValueChange={(value) => onChange('state', value)}
            >
              <SelectTrigger
                id="new-state"
                className={cn(fieldClass, 'w-full')}
                aria-invalid={Boolean(errors['state'])}
                aria-describedby="new-state-error"
              >
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent>
                {usStates.map((usState) => (
                  <SelectItem key={usState.value} value={usState.value}>
                    {usState.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`new-${field.key}`}
              className={fieldClass}
              value={draft[field.key]}
              autoComplete={field.autoComplete}
              required={field.required}
              onChange={(event) => onChange(field.key, event.target.value)}
              aria-invalid={Boolean(errors[field.key])}
              aria-describedby={`new-${field.key}-error`}
            />
          )}
          <ErrorText
            id={`new-${field.key}-error`}
            message={errors[field.key]}
          />
        </div>
      ))}

      <ErrorText id="address-save-error" message={saveError} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onSave} disabled={busy}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </fieldset>
  );
}

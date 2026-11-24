import { ErrorText } from '@/components/item-form/ItemFormParts';
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
import { addressAutoComplete, addressFields } from '@/lib/addressForm';
import type { AddressDraft } from '@/lib/addressForm';
import { usStates } from '@/lib/usStates';

export function AddressFields({
  draft,
  errors,
  saveError,
  saving,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  draft: AddressDraft;
  errors: Record<string, string>;
  saveError: string;
  saving: boolean;
  busy: boolean;
  onChange: (key: keyof AddressDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <fieldset className="min-w-0 space-y-4 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">New pickup address</legend>

      {addressFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`new-${field.key}`}>
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
                className="w-full"
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
              value={draft[field.key]}
              autoComplete={addressAutoComplete[field.key] ?? 'off'}
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
          {saving ? 'Saving…' : 'Save address'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel address
        </Button>
      </div>
    </fieldset>
  );
}

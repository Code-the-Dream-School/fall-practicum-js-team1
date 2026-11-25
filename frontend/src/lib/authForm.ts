import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

export const registerField = <T extends FieldValues>(
  form: UseFormReturn<T>,
  name: Path<T>,
  onChange?: () => void,
) =>
  form.register(name, {
    onBlur: () => {
      if (form.getValues(name)) {
        void form.trigger(name);
      }
    },
    onChange: () => {
      if (form.formState.errors[name]) {
        form.clearErrors(name);
      }

      onChange?.();
    },
  });

import { Check, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { passwordRules } from '@/schemas/registerSchema';

type PasswordChecklistProps = {
  id: string;
  password: string;
  showResults: boolean;
};

const getStatus = (isMet: boolean, showResults: boolean) => {
  if (!showResults) {
    return { Icon: Circle, color: 'text-muted-foreground' };
  }

  if (isMet) {
    return { Icon: Check, color: 'text-green-700 dark:text-green-400' };
  }

  return { Icon: X, color: 'text-red-600 dark:text-red-400' };
};

export default function PasswordChecklist({
  id,
  password,
  showResults,
}: PasswordChecklistProps) {
  return (
    <ul
      id={id}
      aria-label="Password requirements"
      className="grid gap-x-4 gap-y-1 rounded-xl bg-muted/50 px-3.5 py-3 sm:grid-cols-2"
    >
      {passwordRules.map((rule) => {
        const isMet = rule.test(password);
        const { Icon, color } = getStatus(isMet, showResults);

        return (
          <li
            key={rule.label}
            className={cn('flex items-center gap-2 text-[13px]', color)}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {rule.label}
            {showResults && (
              <span className="sr-only">{isMet ? ' (met)' : ' (not met)'}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

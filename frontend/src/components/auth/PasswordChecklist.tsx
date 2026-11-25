import { Check, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { passwordRules } from '@/schemas/registerSchema';

type Status = 'idle' | 'met' | 'missing';

const statusStyles = {
  idle: { icon: Circle, className: 'text-muted-foreground' },
  met: { icon: Check, className: 'text-green-700 dark:text-green-400' },
  missing: { icon: X, className: 'text-red-600 dark:text-red-400' },
};

const statusOf = (met: boolean, showResults: boolean): Status => {
  if (!showResults) return 'idle';

  return met ? 'met' : 'missing';
};

export default function PasswordChecklist({
  id,
  password,
  showResults,
}: {
  id: string;
  password: string;
  showResults: boolean;
}) {
  return (
    <ul
      id={id}
      aria-label="Password requirements"
      className="grid gap-x-4 gap-y-1 rounded-xl bg-muted/50 px-3.5 py-3 sm:grid-cols-2"
    >
      {passwordRules.map((rule) => {
        const status = statusOf(rule.test(password), showResults);
        const { icon: Icon, className } = statusStyles[status];

        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-2 text-[13px] transition-colors',
              className,
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {rule.label}
            {status !== 'idle' && (
              <span className="sr-only">
                {status === 'met' ? ' (met)' : ' (not met)'}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

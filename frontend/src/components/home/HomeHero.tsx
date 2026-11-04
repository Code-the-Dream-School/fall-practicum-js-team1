import type { FormEvent } from 'react';
import { Baby, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type HomeHeroProps = {
  searchText: string;
  popularCategories: { value: string; label: string }[];
  onSearch: (text: string) => void;
  onPopularClick: (category: string) => void;
};

export const HomeHero = ({
  searchText,
  popularCategories,
  onSearch,
  onPopularClick,
}: HomeHeroProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = new FormData(event.currentTarget).get('q');
    onSearch(String(text).trim());
  };

  return (
    <section className="bg-hero">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-14 lg:py-20">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance lg:text-5xl">
            Somebody in your community has the thing your baby needs next.
          </h1>
          <p className="max-w-xl text-base text-foreground/80 lg:text-lg">
            Free baby and toddler gear from families in your neighborhood. Claim
            what you need, and pass on what your kids have outgrown.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex max-w-xl items-center rounded-full bg-background p-1.5 shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-ring"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Label htmlFor="q" className="sr-only">
                Search items
              </Label>

              <Input
                key={searchText}
                id="q"
                name="q"
                defaultValue={searchText}
                placeholder="Search strollers, cribs, high chairs"
                className="h-10 border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" className="rounded-full px-6">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Popular:</span>
            {popularCategories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => onPopularClick(category.value)}
                className="rounded-full bg-background/70 px-3 py-1 transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {category.label}
              </button>
            ))}
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <li className="flex items-center gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Owners approve each claim
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Address stays hidden
            </li>
          </ul>
        </div>

        <div className="order-first flex h-40 items-center justify-center rounded-3xl bg-hero-image sm:h-56 lg:order-last lg:h-80 lg:w-2/5">
          <Baby
            className="size-20 text-foreground/40 lg:size-28"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};

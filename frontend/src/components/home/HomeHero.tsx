import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight,
  EyeOff,
  Gift,
  HandHeart,
  Pause,
  Play,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeroScene } from '@/components/home/HeroScene';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';

const placeholderPhrases = [
  'Search for a stroller',
  'Search for a crib',
  'Search for a high chair',
  'Search for toys',
];

type HomeHeroProps = {
  searchText: string;
  onSearch: (text: string) => void;
};

export const HomeHero = ({ searchText, onSearch }: HomeHeroProps) => {
  const [paused, setPaused] = useState(false);
  const placeholder = useTypingPlaceholder(
    placeholderPhrases,
    'Search strollers, cribs...',
    paused,
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = new FormData(e.currentTarget).get('q');
    onSearch(String(text).trim());
  };

  return (
    <section className="relative overflow-hidden bg-hero-mesh">
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-8">
        <div className="space-y-6 max-lg:text-center">
          <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
            Somebody in your community has{' '}
            <span className="bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)] dark:bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_26%,transparent)_62%)] box-decoration-clone">
              the thing your baby needs next.
            </span>
          </h1>
          <p className="max-w-lg text-xl font-medium text-foreground/90 max-lg:mx-auto">
            Free baby and toddler gear, handed down by families nearby.
          </p>

          <div className="flex flex-wrap gap-2.5 max-lg:justify-center">
            <span className="flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,#ee7c6c_20%,transparent)] py-1.5 pr-4 pl-2 text-sm font-semibold">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#ee7c6c] text-white">
                <HandHeart className="size-4" aria-hidden="true" />
              </span>
              Need it? Claim it
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,#5c96cd_20%,transparent)] py-1.5 pr-4 pl-2 text-sm font-semibold">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#5c96cd] text-white">
                <Gift className="size-4" aria-hidden="true" />
              </span>
              Outgrown it? Pass it on
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex max-w-xl items-center rounded-full bg-background p-1.5 shadow-lg ring-1 ring-border focus-within:ring-2 focus-within:ring-ring max-lg:mx-auto"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
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
                placeholder={placeholder}
                className="h-11 border-0 bg-transparent pl-12 dark:bg-transparent text-sm shadow-none focus-visible:ring-0 sm:text-base"
              />
            </div>
            <Button type="submit" className="h-10 rounded-full px-6 text-base">
              Search
            </Button>
          </form>

          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-foreground/80 max-lg:justify-center">
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Owners approve each claim
            </li>
            <li className="flex items-center gap-1.5">
              <EyeOff className="size-4 text-primary" aria-hidden="true" />
              Address stays hidden
            </li>
          </ul>
        </div>

        <div className="mx-auto hidden w-full max-w-sm space-y-2 lg:block xl:max-w-md">
          <HeroScene paused={paused} />
          <Button
            asChild
            variant="outline"
            className="group mx-auto flex h-10 w-fit rounded-full bg-background/70 px-5 text-sm shadow-sm backdrop-blur hover:bg-background hover:shadow-md"
          >
            <Link to="/items/new">
              Have gear to pass on? Post an item
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-3 rounded-full text-foreground/60 hover:text-foreground"
        aria-label={paused ? 'Play animations' : 'Pause animations'}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <Play /> : <Pause />}
      </Button>
    </section>
  );
};

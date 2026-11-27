import { Link } from 'react-router';
import {
  Camera,
  EyeOff,
  Gift,
  HandHeart,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { PageBackdrop } from '@/components/item-details/ItemDetailParts';
import { Button } from '@/components/ui/button';
import { tints } from '@/lib/itemForm';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Camera,
    tint: tints.coral,
    title: 'Post what they outgrew',
    text: 'Add a few photos, say what shape it is in and where to pick it up. It takes a couple of minutes.',
  },
  {
    icon: HandHeart,
    tint: tints.blue,
    title: 'Neighbors ask for it',
    text: 'Families nearby request the item. You read their note and choose who gets it.',
  },
  {
    icon: PackageCheck,
    tint: tints.sage,
    title: 'Hand it over',
    text: 'Agree on a time, meet for pickup and mark it as picked up. That is it.',
  },
];

const promises = [
  {
    icon: Gift,
    title: 'Always free',
    text: 'Nothing is sold here. Gear moves from one family to the next.',
  },
  {
    icon: ShieldCheck,
    title: 'Owners decide',
    text: 'Nobody gets an item until the owner approves their request.',
  },
  {
    icon: EyeOff,
    title: 'Your address stays private',
    text: 'Only your city is public. The street address goes to the person you approve.',
  },
];

export default function AboutPage() {
  return (
    <PageBackdrop variant="arches">
      <div className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6 md:py-20">
        <section className="max-w-2xl space-y-5">
          <h1 className="text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl">
            Handed down,{' '}
            <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
              not thrown out
            </span>
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Babies outgrow things fast. Strollers, cribs and car seats are
            barely worn out when a child is done with them, and the next family
            down the street needs them. Hand Me Down connects the two, for free.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 rounded-full px-6">
              <Link to="/">Browse items</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="space-y-3 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl text-white',
                    step.tint.solid,
                  )}
                >
                  <step.icon className="size-6" />
                </span>
                <h3 className="text-xl font-semibold">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">What you can count on</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {promises.map((promise) => (
              <li
                key={promise.title}
                className="flex gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border"
              >
                <promise.icon
                  className="mt-0.5 size-6 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <h3 className="font-semibold">{promise.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {promise.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl bg-accent-sun/20 p-8 text-center ring-1 ring-accent-sun/40">
          <h2 className="text-3xl font-semibold">
            Got something your little one outgrew?
          </h2>
          <p className="text-muted-foreground">
            Someone nearby is looking for it right now.
          </p>
          <Button asChild className="h-11 rounded-full px-6">
            <Link to="/items/new">Post an item</Link>
          </Button>
        </section>
      </div>
    </PageBackdrop>
  );
}

import { ChevronRight } from 'lucide-react';
import approve from '@/assets/claim/approve.svg';
import claim from '@/assets/claim/claim.svg';
import pickup from '@/assets/claim/pickup.svg';
import post from '@/assets/claim/post.svg';

const steps = [
  {
    title: 'Post it',
    alt: 'A phone taking a photo of baby gear to post it.',
    image: post,
    tint: '#ee7c6c',
  },
  {
    title: 'Claim it',
    alt: 'Tapping a claim button on an item. The owner gets a notification bell.',
    image: claim,
    tint: '#5c96cd',
  },
  {
    title: 'Owner picks',
    alt: 'The owner picks one family. One request gets a green check, the other waits.',
    image: approve,
    tint: '#6faf86',
  },
  {
    title: 'Meet & pick up',
    alt: 'Two parents meet and hand over the gift-wrapped item at a pin on the map.',
    image: pickup,
    tint: '#e8b43c',
  },
];

export const HowItWorks = () => {
  return (
    <section className="border-y border-divider bg-[color-mix(in_oklab,var(--primary)_8%,var(--background))]">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <h2 className="text-3xl font-semibold tracking-tight">
          How a claim works
        </h2>

        <ol className="mt-5 grid grid-cols-2 sm:mt-8 gap-x-3 gap-y-6 lg:grid-cols-4 lg:gap-x-12">
          {steps.map(({ title, alt, image, tint }, index) => (
            <li key={title}>
              <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background sm:size-7 sm:text-sm">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold sm:text-lg">{title}</h3>
              </div>

              <div className="relative">
                <div
                  className="overflow-hidden rounded-2xl ring-1 ring-border sm:rounded-3xl"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${tint} 13%, var(--background))`,
                  }}
                >
                  <img src={image} alt={alt} className="aspect-[4/3] w-full" />
                </div>

                {index < steps.length - 1 && (
                  <ChevronRight
                    className="absolute top-1/2 -right-[38px] hidden size-7 -translate-y-1/2 text-muted-foreground/60 lg:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

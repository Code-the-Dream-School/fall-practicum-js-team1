import { HandHeart, ImagePlus, PackageCheck, UserCheck } from 'lucide-react';

const steps = [
  {
    title: "Post what you've outgrown",
    text: 'Add a few details and a photo. It takes a couple of minutes.',
    icon: <ImagePlus className="size-5" aria-hidden="true" />,
  },
  {
    title: 'Claim what you need',
    text: 'Found something? Claim it and the owner is notified.',
    icon: <HandHeart className="size-5" aria-hidden="true" />,
  },
  {
    title: 'The owner approves',
    text: 'They pick who gets it, so one item never goes to two families.',
    icon: <UserCheck className="size-5" aria-hidden="true" />,
  },
  {
    title: 'Meet and pick up',
    text: 'Once the item is handed over, the owner marks it picked up.',
    icon: <PackageCheck className="size-5" aria-hidden="true" />,
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-section">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-semibold tracking-tight">
          How a claim works
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-divider">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-3 lg:px-6 lg:first:pl-0 lg:last:pr-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-5xl leading-none font-bold text-step-number">
                  {index + 1}
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-background">
                  {step.icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

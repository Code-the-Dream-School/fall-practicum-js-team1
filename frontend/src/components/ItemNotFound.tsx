import { Link } from 'react-router';
import { Home } from 'lucide-react';
import { PageBackdrop } from '@/components/item-details/ItemDetailParts';
import { Button } from '@/components/ui/button';

export default function ItemNotFound() {
  return (
    <PageBackdrop
      variant="diamonds"
      className="flex min-h-[calc(100svh-9rem)] items-center justify-center"
    >
      <div className="w-[min(36rem,calc(100vw-3rem))] space-y-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
            Item not found
          </span>
        </h1>

        <p className="text-lg text-muted-foreground">
          This item may have been withdrawn or handed down already. Let&apos;s
          find you another one.
        </p>

        <Button asChild className="h-11 rounded-full px-6">
          <Link to="/">
            <Home />
            Go to Home page
          </Link>
        </Button>
      </div>
    </PageBackdrop>
  );
}

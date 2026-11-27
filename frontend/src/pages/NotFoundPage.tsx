import { Link } from 'react-router';
import { Home } from 'lucide-react';
import { PageBackdrop } from '@/components/item-details/ItemDetailParts';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <PageBackdrop
      variant="hexagons"
      className="flex min-h-[calc(100svh-9rem)] items-center justify-center"
    >
      <div className="w-[min(36rem,calc(100vw-3rem))] space-y-6 py-16 text-center">
        <p className="font-display text-7xl font-bold tracking-tight">404</p>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
              Page not found
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            This page may have been handed down to someone else. Let&apos;s get
            you back to something that&apos;s still here.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="h-11 rounded-full px-6">
            <Link to="/">
              <Home />
              Go to Home page
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-full px-6">
            <Link to="/about">About Hand Me Down</Link>
          </Button>
        </div>
      </div>
    </PageBackdrop>
  );
}

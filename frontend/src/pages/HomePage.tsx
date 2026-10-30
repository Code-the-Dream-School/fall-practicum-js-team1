import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Home page</h1>
      {/* TEMPORARY (JIRA-50) */}
      <div className="p-6">
        <Button asChild className="rounded-full">
          <Link to="/preview">
            Component preview
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </>
  );
}

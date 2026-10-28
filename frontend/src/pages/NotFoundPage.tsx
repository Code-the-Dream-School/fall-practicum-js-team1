import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Page not found</h1>

      <Link to={'/'}>Go to Home page</Link>
    </>
  );
}

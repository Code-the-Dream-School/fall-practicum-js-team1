import { useLocation } from 'react-router';

export default function ItemDetailsPage() {
  const location = useLocation();
  const state: unknown = location.state;

  const justPosted =
    typeof state === 'object' &&
    state !== null &&
    'message' in state &&
    state.message === 'Your item was posted';

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      {justPosted && (
        <p
          role="status"
          className="rounded-md border border-green-300 p-3 text-green-700"
        >
          Your item was posted
        </p>
      )}

      <h1 className="text-2xl font-semibold">Item Details page</h1>
    </main>
  );
}

import { useEffect, useState } from 'react';
import mockData from '../api/mockData.json';

export type Category = {
  id: number;
  key: string;
  name: string;
};

const useMocks =
  import.meta.env['VITE_USE_MOCKED_API_CALLS'] === 'true';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        if (useMocks) {
          setCategories(mockData.categories);
          return;
        }

        const baseUrl = (
          import.meta.env['VITE_API_BASE_URL'] ?? ''
        ).replace(/\/$/, '');

        const response = await fetch(
          `${baseUrl}/api/categories`,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Could not load categories.');
        }

        const result = await response.json();

        if (!Array.isArray(result.data?.categories)) {
          throw new Error('Unexpected category response.');
        }

        if (!controller.signal.aborted) {
          setCategories(result.data.categories);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(
            'Could not load categories. Please try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  return { categories, loading, error };
}
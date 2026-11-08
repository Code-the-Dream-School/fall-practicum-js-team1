import { useEffect, useState } from 'react';
import { getCategories } from '../services/itemApi';
import type { Category } from '../services/itemApi';

export type { Category } from '../services/itemApi';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getCategories();

        if (active) {
          setCategories(result);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : 'Could not load categories. Please try again.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
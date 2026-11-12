import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/client';

export type { Category } from '@/types';

export function useCategories() {
  const { data, isPending, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  return {
    categories: data ?? [],
    loading: isPending,
    error: error?.message || '',
  };
}

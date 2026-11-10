import type { ComponentProps } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getItems } from '@/api/client';
import { ActiveFilters } from '@/components/home/ActiveFilters';
import { FilterBar } from '@/components/home/FilterBar';
import { HomeHero } from '@/components/home/HomeHero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ItemResults } from '@/components/home/ItemResults';

const PAGE_SIZE = 12;
const POPULAR_COUNT = 3;
const ONE_YEAR = 12;
const THREE_YEARS = 36;
const FIVE_YEARS = 60;

const conditionOptions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
];

const ageOptions = [
  { value: 'under-1', label: 'Under 1 year', ageMin: 0, ageMax: ONE_YEAR - 1 },
  {
    value: '1-3',
    label: '1 to 3 years',
    ageMin: ONE_YEAR,
    ageMax: THREE_YEARS - 1,
  },
  {
    value: '3-5',
    label: '3 to 5 years',
    ageMin: THREE_YEARS,
    ageMax: FIVE_YEARS,
  },
];

const pickValid = (options: { value: string }[], value: string) => {
  return options.some((option) => option.value === value) ? value : '';
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.key,
    label: category.name,
  }));

  const searchText = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const categoryParam = searchParams.get('category') || '';
  const category = categories
    ? pickValid(categoryOptions, categoryParam)
    : categoryParam;
  const condition = pickValid(
    conditionOptions,
    searchParams.get('condition') || '',
  );
  const age = pickValid(ageOptions, searchParams.get('age') || '');
  const ageOption = ageOptions.find((option) => option.value === age);

  const filters = {
    q: searchText,
    category,
    condition,
    city,
    ageMin: ageOption?.ageMin,
    ageMax: ageOption?.ageMax,
    page: 1,
    limit: page * PAGE_SIZE,
  };

  // the filters are in the key, so changing a filter fetches again
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['items', filters],
    queryFn: () => getItems(filters),
    placeholderData: (previous) => previous,
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key !== 'page') {
      next.delete('page');
    }

    setSearchParams(next, { replace: key === 'page' });
  };

  const dropdowns = [
    {
      param: 'category',
      label: 'Category',
      allLabel: 'All categories',
      value: category,
      options: categoryOptions,
    },
    {
      param: 'condition',
      label: 'Condition',
      allLabel: 'Any condition',
      value: condition,
      options: conditionOptions,
    },
    {
      param: 'age',
      label: 'Age',
      allLabel: 'Any age',
      value: age,
      options: ageOptions,
    },
  ];

  const activeFilters = [
    { key: 'q', label: `"${searchText}"`, value: searchText },
    ...dropdowns.map((dropdown) => ({
      key: dropdown.param,
      label:
        dropdown.options.find((option) => option.value === dropdown.value)
          ?.label || '',
      value: dropdown.value,
    })),
    { key: 'city', label: `In ${city}`, value: city },
  ].filter((filter) => filter.value);

  return (
    <>
      <HomeHero
        searchText={searchText}
        popularCategories={categoryOptions.slice(0, POPULAR_COUNT)}
        onSearch={(text) => setParam('q', text)}
        onPopularClick={(value) => setParam('category', value)}
      />

      <section className="mx-auto max-w-6xl space-y-6 px-6 py-10 lg:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Just posted
          </h2>
          {!isLoading && !isError && (
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {pagination.hasNext && `Showing ${items.length} of `}
              {pagination.total} {pagination.total === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>

        <FilterBar
          filters={dropdowns}
          city={city}
          onFilterChange={(param, value) => setParam(param, value)}
        />

        <ActiveFilters
          filters={activeFilters}
          onRemove={(key) => setParam(key, '')}
          onClearAll={() => setSearchParams({})}
        />

        <ItemResults
          items={items as ComponentProps<typeof ItemResults>['items']}
          hasMore={pagination.hasNext}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          onSeeMore={() => setParam('page', String(page + 1))}
          onClearFilters={() => setSearchParams({})}
        />
      </section>

      <HowItWorks />
    </>
  );
}

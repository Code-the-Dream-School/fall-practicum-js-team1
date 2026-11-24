import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import {
  createItem,
  getAddresses,
  getCategories,
  uploadPhoto,
} from '@/api/client';
import PostItemPage from '@/pages/PostItemPage';

const progressPercent = 40;
const uploadAttempts = 2;

const startsWith = (text: string) => (accessibleName: string) =>
  accessibleName.startsWith(text);

vi.mock('@/api/client', () => ({
  createItem: vi.fn(),
  createAddress: vi.fn(),
  getAddresses: vi.fn(),
  getCategories: vi.fn(),
  uploadPhoto: vi.fn(),
}));

it('shows progress and lets the user retry a failed upload without losing the form', async () => {
  vi.mocked(getCategories).mockResolvedValue([
    { key: 'strollers', name: 'Strollers' },
  ]);
  vi.mocked(getAddresses).mockResolvedValue([
    {
      id: 'address-1',
      nickname: 'Home',
      line1: '1 Test St',
      line2: null,
      city: 'San Rafael',
      state: 'CA',
      postalCode: '94901',
      isDefault: true,
    },
  ]);

  let finishUpload!: (photo: { url: string; publicId: string }) => void;
  vi.mocked(uploadPhoto)
    .mockRejectedValueOnce(new Error('Upload failed'))
    .mockImplementationOnce((_file, onProgress) => {
      onProgress?.(progressPercent);
      return new Promise((resolve) => {
        finishUpload = resolve;
      });
    });

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <PostItemPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  const file = new File(['photo'], 'stroller.png', { type: 'image/png' });
  await user.upload(
    screen.getByLabelText('Add photos', { selector: 'input', exact: false }),
    file,
  );
  await user.click(screen.getByRole('button', { name: 'Next' }));

  const title = screen.getByLabelText('Item title', { exact: false });
  const description = screen.getByLabelText('Description', { exact: false });
  await user.type(title, 'Travel stroller');
  await user.type(description, 'Folds for easy storage.');
  screen.getByRole('combobox', { name: startsWith('Category') }).focus();
  await user.keyboard('s');
  await user.click(screen.getByRole('radio', { name: startsWith('Good') }));
  await user.click(screen.getByRole('button', { name: 'Next' }));

  await user.click(await screen.findByRole('button', { name: 'Post item' }));

  // The failed upload sends the user back to the photos step to retry it.
  const retry = await screen.findByRole('button', {
    name: 'Retry upload for stroller.png',
  });
  expect(createItem).not.toHaveBeenCalled();

  await user.click(retry);
  expect(
    await screen.findByRole('progressbar', {
      name: 'Upload progress for stroller.png',
    }),
  ).toHaveAttribute('value', String(progressPercent));

  await act(async () =>
    finishUpload({ url: '/photos/stroller.png', publicId: 'stroller' }),
  );
  expect(await screen.findByText('Uploaded (100%)')).toBeVisible();
  expect(uploadPhoto).toHaveBeenCalledTimes(uploadAttempts);
  expect(vi.mocked(uploadPhoto).mock.calls[1]?.[0]).toBe(file);
  expect(
    screen.queryByRole('button', { name: startsWith('Retry upload') }),
  ).toBeNull();
  expect(createItem).not.toHaveBeenCalled();

  // The form was kept while the photo was retried.
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByLabelText('Item title', { exact: false })).toHaveValue(
    'Travel stroller',
  );
  expect(screen.getByLabelText('Description', { exact: false })).toHaveValue(
    'Folds for easy storage.',
  );
});

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

  let failUpload!: (error: Error) => void;
  vi.mocked(uploadPhoto)
    .mockImplementationOnce((_file, onProgress) => {
      onProgress?.(40);
      return new Promise((_resolve, reject) => {
        failUpload = reject;
      });
    })
    .mockResolvedValueOnce({
      url: '/photos/stroller.png',
      publicId: 'stroller',
    });

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <PostItemPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  const title = screen.getByLabelText(/Item Title/i);
  const description = screen.getByLabelText(/Description/i);
  await user.type(title, 'Travel stroller');
  await user.type(description, 'Folds for easy storage.');

  screen.getByRole('combobox', { name: /Category/i }).focus();
  await user.keyboard('s');
  screen.getByRole('combobox', { name: /Condition/i }).focus();
  await user.keyboard('g');

  const file = new File(['photo'], 'stroller.png', { type: 'image/png' });
  await user.upload(
    screen.getByLabelText(/Item Photos/i, { selector: 'input' }),
    file,
  );
  await user.click(screen.getByRole('button', { name: 'Post Item' }));

  expect(
    await screen.findByRole('progressbar', { name: /stroller.png/ }),
  ).toHaveAttribute('value', '40');

  await act(async () => failUpload(new Error('Upload failed')));
  const retry = await screen.findByRole('button', {
    name: 'Retry upload for stroller.png',
  });
  expect(title).toHaveValue('Travel stroller');
  expect(description).toHaveValue('Folds for easy storage.');
  expect(createItem).not.toHaveBeenCalled();

  await user.click(retry);
  expect(await screen.findByText('Uploaded (100%)')).toBeVisible();
  expect(uploadPhoto).toHaveBeenCalledTimes(2);
  expect(vi.mocked(uploadPhoto).mock.calls[1]?.[0]).toBe(file);
  expect(screen.queryByRole('button', { name: /Retry upload/ })).toBeNull();
  expect(createItem).not.toHaveBeenCalled();
});
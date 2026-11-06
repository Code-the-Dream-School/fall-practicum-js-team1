import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type Category = {
  key: string;
  name: string;
};

type Address = {
  id: string;
  nickname?: string | null;
  line1: string;
  city: string;
  state: string;
};

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
];

export default function PostItemPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [addressId, setAddressId] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState('');

  async function loadOptions() {
    setMessage('');

    try {
      const [categoryResponse, addressResponse] = await Promise.all([
        fetch('/api/categories', {
          credentials: 'include',
        }),
        fetch('/api/addresses', {
          credentials: 'include',
        }),
      ]);

      if (!categoryResponse.ok || !addressResponse.ok) {
        throw new Error('Unable to load categories or addresses.');
      }

      const categoryResult = await categoryResponse.json();
      const addressResult = await addressResponse.json();

      setCategories(categoryResult.data);
      setAddresses(addressResult.data);
    } catch {
      setMessage(
        'Could not load options. Please check your connection.'
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      'Your form is ready! Item submission will be connected to the API in a later step.'
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Post an Item</h1>

      <p className="text-sm text-muted-foreground">
        Share baby gear with families in your community.
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={loadOptions}
      >
        Load Categories and Addresses
      </Button>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="title">Item Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter item title"
            maxLength={80}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your item"
            maxLength={1000}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={category}
            onValueChange={setCategory}
            required
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Condition *</Label>
          <Select
            value={condition}
            onValueChange={setCondition}
            required
          >
            <SelectTrigger id="condition">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="childAgeMinMonths">
              Minimum Child Age (months)
            </Label>
            <Input
              id="childAgeMinMonths"
              name="childAgeMinMonths"
              type="number"
              min={0}
              max={120}
              step={1}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childMaxAgeMonths">
              Maximum Child Age (months)
            </Label>
            <Input
              id="childMaxAgeMonths"
              name="childMaxAgeMonths"
              type="number"
              min={0}
              max={120}
              step={1}
              placeholder="24"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Pickup Address *</Label>
          <Select
            value={addressId}
            onValueChange={setAddressId}
            required
          >
            <SelectTrigger id="address">
              <SelectValue placeholder="Choose your address" />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((address) => (
                <SelectItem
                  key={address.id}
                  value={address.id}
                >
                  {address.nickname || address.line1} -{' '}
                  {address.city}, {address.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Only your city is shown publicly. Your address is shared
            only with the person you approve.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="photos">Item Photos * (1–6)</Label>
          <Input
            id="photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            onChange={(event) => {
              const selected = Array.from(
                event.target.files ?? []
              );

              if (selected.length > 6) {
                setPhotos([]);
                event.target.value = '';
                setMessage(
                  'Please select no more than 6 photos.'
                );
                return;
              }

              setPhotos(selected);
              setMessage('');
            }}
          />
          <p className="text-xs text-muted-foreground">
            {photos.length} photo(s) selected
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">
            Pickup Instructions
          </Label>
          <Textarea
            id="instructions"
            name="instructions"
            maxLength={300}
            placeholder="Optional pickup instructions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">
            Pickup Availability
          </Label>
          <Input
            id="availability"
            name="availability"
            maxLength={200}
            placeholder="Example: Weekdays after 5 PM"
          />
        </div>

        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}

        <Button type="submit" disabled>
          Post Item
        </Button>
      </form>
    </main>
  );
}
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

type Props = {
  photos: File[];
  onChange: (photos: File[]) => void;
};

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

const maxSize = 5 * 1024 * 1024;

function PhotoPreview({ file }: { file: File }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const reader = new FileReader();
    let active = true;

    reader.onload = () => {
      if (active && typeof reader.result === 'string') {
        setSrc(reader.result);
      }
    };

    reader.readAsDataURL(file);

    return () => {
      active = false;

      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [file]);

  return src ? (
    <img
      src={src}
      alt={`Preview of ${file.name}`}
      className="h-32 w-full rounded-md object-cover"
    />
  ) : (
    <p className="text-sm">Loading preview…</p>
  );
}

export default function ItemPhotoPicker({ photos, onChange }: Props) {
  const [error, setError] = useState('');

  return (
    <div className="space-y-3">
      <Label htmlFor="photos">Item Photos * (1–6)</Label>

      <Input
        id="photos"
        name="photos"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'photos-help photos-error' : 'photos-help'}
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);

          // Allow choosing the same file again after removing it.
          event.target.value = '';

          if (selected.length === 0) {
            return;
          }

          if (photos.length + selected.length > 6) {
            setError('You can add up to 6 photos');
            return;
          }

          for (const file of selected) {
            if (!allowedTypes.includes(file.type)) {
              setError(`${file.name} is not a jpg, png or webp image`);
              return;
            }

            if (file.size > maxSize) {
              setError(`${file.name} is larger than 5 MB`);
              return;
            }
          }

          setError('');
          onChange([...photos, ...selected]);
        }}
      />

      <p id="photos-help" className="text-xs text-muted-foreground">
        Choose 1–6 JPG, PNG or WebP images, up to 5 MB each. The first photo is
        your cover.
      </p>

      {error && (
        <p id="photos-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="space-y-2 rounded-md border p-2"
          >
            <PhotoPreview file={file} />

            {index === 0 && (
              <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium">
                Cover
              </span>
            )}

            <p className="break-all text-xs">{file.name}</p>

            <Button
              type="button"
              variant="outline"
              aria-label={`Remove ${file.name}`}
              onClick={() => {
                onChange(
                  photos.filter((_, photoIndex) => photoIndex !== index),
                );
                setError('');
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {photos.length} photo(s) selected
      </p>
    </div>
  );
}

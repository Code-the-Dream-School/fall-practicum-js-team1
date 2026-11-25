import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export type PhotoUploadState =
  | { status: 'uploading'; progress?: number | undefined }
  | { status: 'uploaded' }
  | { status: 'failed'; message: string };

type Props = {
  photos: File[];
  onChange: (photos: File[]) => void;
  uploadStates?: ReadonlyMap<File, PhotoUploadState>;
  onRetry?: (file: File) => void;
  disabled?: boolean;
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

export default function ItemPhotoPicker({
  photos,
  onChange,
  uploadStates,
  onRetry,
  disabled = false,
}: Props) {
  const [error, setError] = useState('');

  return (
    <div className="space-y-3">
      <Label htmlFor="photos">Item Photos * (1–6)</Label>

      <Input
        id="photos"
        name="photos"
        type="file"
        disabled={disabled}
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

            <PhotoUploadStatus
              file={file}
              state={uploadStates?.get(file)}
              disabled={disabled}
              onRetry={onRetry}
            />

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
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

function PhotoUploadStatus({
  file,
  state,
  disabled,
  onRetry,
}: {
  file: File;
  state: PhotoUploadState | undefined;
  disabled: boolean;
  onRetry: ((file: File) => void) | undefined;
}) {
  if (!state) return null;

  if (state.status === 'uploading') {
    return (
      <div className="space-y-1">
        <progress
          max={100}
          value={state.progress}
          aria-label={`Upload progress for ${file.name}`}
          className="h-2 w-full"
        />
        <p role="status" className="text-xs">
          {state.progress === undefined
            ? 'Uploading...'
            : `Uploading ${state.progress}%`}
        </p>
      </div>
    );
  }

  if (state.status === 'uploaded') {
    return (
      <p role="status" className="text-xs">
        Uploaded (100%)
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p role="alert" className="break-words text-xs text-red-600">
        {file.name}: {state.message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={`Retry upload for ${file.name}`}
          onClick={() => onRetry(file)}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

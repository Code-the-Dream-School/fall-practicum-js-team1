import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

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

const maxSizeMb = 5;
const bytesPerMb = 1024 * 1024;
const maxSize = maxSizeMb * bytesPerMb;

const maxPhotos = 6;

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
      className="size-full object-cover"
    />
  ) : (
    <div className="size-full animate-pulse bg-muted" />
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
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const full = photos.length >= maxPhotos;

  const addFiles = (selected: File[]) => {
    if (selected.length === 0) {
      return;
    }

    if (photos.length + selected.length > maxPhotos) {
      setError(`You can add up to ${maxPhotos} photos`);
      return;
    }

    const wrongType = selected.find(
      (file) => !allowedTypes.includes(file.type),
    );
    const oversized = selected.find((file) => file.size > maxSize);

    if (wrongType) {
      setError(`${wrongType.name} is not a jpg, png or webp image`);
      return;
    }

    if (oversized) {
      setError(`${oversized.name} is larger than ${maxSizeMb} MB`);
      return;
    }

    setError('');
    onChange([...photos, ...selected]);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);

    if (!full) {
      addFiles(Array.from(event.dataTransfer.files));
    }
  };

  const dropzoneClass = cn(
    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
    dragging
      ? 'border-primary bg-primary/10'
      : 'border-border bg-muted/40 hover:border-primary/60 hover:bg-primary/5',
  );

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id="photos"
        name="photos"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={full || disabled}
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'photos-help photos-error' : 'photos-help'}
        className="peer sr-only"
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);

          if (inputRef.current) {
            inputRef.current.value = '';
          }

          addFiles(selected);
        }}
      />

      {photos.length === 0 ? (
        <label
          htmlFor="photos"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(dropzoneClass, 'px-4 py-10')}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ImagePlus className="size-6" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">Add photos</span>
          <span className="text-sm text-muted-foreground">
            Drag and drop, or tap to choose from your device
          </span>
        </label>
      ) : (
        <ul className="grid grid-cols-3 gap-3">
          {photos.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border"
            >
              <PhotoPreview file={file} />

              <PhotoUploadStatus
                file={file}
                state={uploadStates?.get(file)}
                disabled={disabled}
                onRetry={onRetry}
              />

              {index === 0 ? (
                <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Make ${file.name} the cover photo`}
                  className="absolute bottom-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() =>
                    onChange([
                      file,
                      ...photos.filter((_, photoIndex) => photoIndex !== index),
                    ])
                  }
                >
                  Make cover
                </button>
              )}

              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => {
                  onChange(
                    photos.filter((_, photoIndex) => photoIndex !== index),
                  );
                  setError('');
                }}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}

          {!full && (
            <li className="aspect-square">
              <label
                htmlFor="photos"
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(dropzoneClass, 'size-full text-sm')}
              >
                <ImagePlus
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="font-medium">Add more</span>
              </label>
            </li>
          )}
        </ul>
      )}

      <p
        id="photos-help"
        className="flex flex-wrap justify-between gap-x-4 text-xs text-muted-foreground"
      >
        <span>
          JPG, PNG or WebP, up to {maxSizeMb} MB each. The first photo is your
          cover.
        </span>
        <span aria-live="polite">
          {photos.length} of {maxPhotos} photos
        </span>
      </p>

      {error && (
        <p id="photos-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/85 p-2 text-center">
        <progress
          max={100}
          value={state.progress}
          aria-label={`Upload progress for ${file.name}`}
          className="h-1.5 w-4/5"
        />
        <p role="status" className="text-xs font-medium">
          {state.progress === undefined
            ? 'Uploading...'
            : `Uploading ${state.progress}%`}
        </p>
      </div>
    );
  }

  if (state.status === 'uploaded') {
    return (
      <p
        role="status"
        className="absolute top-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm"
      >
        Uploaded (100%)
      </p>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 p-2 text-center">
      <p role="alert" className="text-xs break-words text-red-600">
        {state.message}
      </p>
      {onRetry && (
        <Button
          type="button"
          size="sm"
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

import { useRef } from 'react';
import ImagePreview from './ImagePreview';
import strings from '../../strings';

interface Props {
  images: File[];
  onChange: (images: File[]) => void;
  maxCount?: number;
}

export default function ImageUploader({ images, onChange, maxCount = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = [...images, ...Array.from(files)].slice(0, maxCount);
    onChange(newImages);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {images.map((file, i) => (
            <ImagePreview key={`${file.name}-${i}`} file={file} onRemove={() => removeImage(i)} />
          ))}
        </div>
      )}
      {images.length < maxCount && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-primary-500 font-medium py-2 px-3 rounded-lg border border-dashed border-primary-300 active:bg-primary-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {strings.addImage}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

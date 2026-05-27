import { useEffect, useState } from 'react';

interface Props {
  file: File;
  onRemove: () => void;
}

export default function ImagePreview({ file, onRemove }: Props) {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-200">
      <img src={preview} alt="" className="w-full h-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

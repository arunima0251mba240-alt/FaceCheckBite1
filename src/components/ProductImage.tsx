import { useState } from 'react';
import { Droplets } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
}

export function ProductImage({ src, alt, title, className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F1F3EE] to-[#E4E8DF] text-[#3F624D] p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Droplets className="w-8 h-8 mb-2 opacity-70" />
        <span className="text-xs font-medium text-center text-[#525C54]">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

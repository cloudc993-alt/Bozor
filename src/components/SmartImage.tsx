import { useState } from 'react';
import { Smartphone } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  darkSurface?: boolean;
}

export function SmartImage({ src, alt, className = '', darkSurface = false }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 p-6 text-center ${
          darkSurface
            ? 'bg-zinc-900 text-zinc-400'
            : 'bg-zinc-100 text-zinc-500'
        } ${className}`}
        role="img"
        aria-label={alt}
      >
        <Smartphone className="h-10 w-10 text-orange-500" strokeWidth={1.5} />
        <span className="max-w-[20ch] text-xs font-medium leading-snug">{alt}</span>
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

import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description?: string;
}

export function SeoHead({ title, description }: SeoHeadProps) {
  useEffect(() => {
    document.title = `${title} | Wonder Cars`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', description);
      }
    }
  }, [title, description]);

  return null;
}

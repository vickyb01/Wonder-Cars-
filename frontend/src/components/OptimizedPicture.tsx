import type { ImgHTMLAttributes } from 'react';
import { getOptimizedWebpUrl } from '../utils/optimizedImages';

interface OptimizedPictureProps extends ImgHTMLAttributes<HTMLImageElement> {
  webpSrc?: string;
}

/**
 * Renders `<picture>` with a verified WebP `<source>` and the original `<img>` fallback,
 * preserving `display: contents` layout behavior so styles and sizing stay identical.
 */
export function OptimizedPicture({ webpSrc, src, ...imgProps }: OptimizedPictureProps) {
  const resolvedWebp = webpSrc || getOptimizedWebpUrl(src);

  if (resolvedWebp && resolvedWebp !== src) {
    return (
      <picture className="contents">
        <source srcSet={resolvedWebp} type="image/webp" />
        <img src={src} {...imgProps} />
      </picture>
    );
  }

  return <img src={src} {...imgProps} />;
}

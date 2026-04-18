import React, { useState } from 'react';
import ImageLightbox from '../ui/ImageLightbox';

/**
 * Renders a clickable image that opens the shared ImageLightbox.
 * Use in product grids, detail pages, or any catalog thumbnail.
 */
export default function ProductPhotoWithLightbox({
  src,
  alt = '',
  caption,
  className = '',
  imgClassName = '',
}) {
  const [open, setOpen] = useState(false);
  if (!src) return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label={alt ? `View larger: ${alt}` : 'View larger image'}
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'zoom-in',
          display: 'block',
          maxWidth: '100%',
        }}
      >
        <img src={src} alt={alt} className={imgClassName} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </button>
      <ImageLightbox
        open={open}
        src={src}
        alt={alt}
        caption={caption}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

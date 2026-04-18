import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './ImageLightbox.css';

/**
 * Full-screen image preview. Renders via portal to document.body.
 * Reuse anywhere you need tap-to-enlarge (products, galleries, reports).
 */
export default function ImageLightbox({ open, src, alt = '', caption, onClose }) {
  const handleKey = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === 'Escape') onClose?.();
    },
    [open, onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  if (!open || !src) return null;

  const node = (
    <div
      className="img-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="img-lightbox-inner">
        <button
          type="button"
          className="img-lightbox-close"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X size={22} />
        </button>
        <img className="img-lightbox-img" src={src} alt={alt} />
        {caption ? <p className="img-lightbox-caption">{caption}</p> : null}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

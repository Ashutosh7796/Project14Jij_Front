import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { productApi } from '../../api/productApi';
import { getOrFetch, invalidateTags, peekForDisplay } from '../../cache/requestCache';
import {
  CACHE_TAGS,
  DEFAULT_TTL_MS,
  SWR_FRESH_MS,
  SWR_STALE_MS,
  cacheKeyProductsList,
  cacheKeyProductPhotos,
} from '../../cache/cacheKeys';
import { useToast } from '../../hooks/useToast';
import { toProductImgSrc } from '../../utils/productImage';
import ImageLightbox from '../../components/ui/ImageLightbox';
import './ProductList.css';

const ITEMS_PER_PAGE = 12;
const SKELETON_CARDS = 8;

function ProductListSkeleton() {
  return (
    <div className="pl-skeleton-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: SKELETON_CARDS }, (_, i) => (
        <div key={i} className="pl-skeleton-card">
          <div className="pl-skeleton-card__img" />
          <div className="pl-skeleton-card__body">
            <div className="pl-skeleton-line pl-skeleton-line--short" />
            <div className="pl-skeleton-line pl-skeleton-line--title" />
            <div className="pl-skeleton-line pl-skeleton-line--price" />
            <div className="pl-skeleton-actions">
              <div className="pl-skeleton-btn" />
              <div className="pl-skeleton-btn" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Image carousel + lightbox on main photo tap ── */
const CardCarousel = ({ images }) => {
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="pl-card__no-photo">
        <ImageOff size={32} strokeWidth={1.5} />
        <span>No Photo</span>
      </div>
    );
  }

  const current = images[idx];
  const prev = (e) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % images.length);
  };

  return (
    <>
      <div className="pl-carousel">
        <button
          type="button"
          className="pl-carousel__img-btn"
          onClick={() => setLightboxOpen(true)}
          aria-label={`Enlarge image: ${current.label || 'product photo'}`}
        >
          <img src={current.src} alt={current.label} className="pl-carousel__img" />
        </button>
        {images.length > 1 && (
          <>
            <button className="pl-carousel__arrow pl-carousel__arrow--left" onClick={prev} aria-label="Previous image">
              <ChevronLeft size={16} />
            </button>
            <button className="pl-carousel__arrow pl-carousel__arrow--right" onClick={next} aria-label="Next image">
              <ChevronRight size={16} />
            </button>
            <div className="pl-carousel__dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`pl-carousel__dot ${i === idx ? 'pl-carousel__dot--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i);
                  }}
                  role="presentation"
                />
              ))}
            </div>
            <span className="pl-carousel__counter">
              {idx + 1}/{images.length}
            </span>
          </>
        )}
        {idx === 0 && <span className="pl-carousel__cover-badge">Cover</span>}
      </div>
      <ImageLightbox
        open={lightboxOpen}
        src={current.src}
        alt={current.label}
        caption={images.length > 1 ? `${current.label} (${idx + 1} of ${images.length})` : current.label}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

/* ── Single product card ── */
const ProductCard = ({ product, photos, onDelete }) => {
  const images = (photos ?? [])
    .map((p, i) => ({
      src: toProductImgSrc(p.imageData, p.contentType),
      label: p.imageType === 'COVERIMAGE' ? 'Cover' : `Photo ${i}`,
      type: p.imageType,
    }))
    .filter((img) => img.src);

  images.sort((a, b) => (a.type === 'COVERIMAGE' ? -1 : b.type === 'COVERIMAGE' ? 1 : 0));

  return (
    <div className="pl-card">
      <div className="pl-card__img-wrap">
        <CardCarousel images={images} />
        <span className={`pl-card__badge ${product.active ? 'pl-card__badge--active' : 'pl-card__badge--inactive'}`}>
          {product.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="pl-card__body">
        <p className="pl-card__type">{product.productType ?? '—'}</p>
        <h3 className="pl-card__name">{product.productName}</h3>
        <div className="pl-card__meta">
          <span className="pl-card__price">
            ₹{Number(product.price ?? 0).toFixed(2)}
            {product.offers > 0 && <span className="pl-card__offer"> {product.offers}% off</span>}
          </span>
          {product.category && <span className="pl-card__category">{product.category}</span>}
        </div>
      </div>
      <div className="pl-card__actions">
        <Link to={`/admin/products/edit/${product.productId}`} className="pl-card__btn pl-card__btn--edit">
          <Pencil size={14} /> Edit
        </Link>
        <button className="pl-card__btn pl-card__btn--delete" onClick={() => onDelete(product.productId, product.productName)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};

/* ── Main list ── */
const ProductList = () => {
  const { showToast, ToastComponent } = useToast();
  const fetchFn = useCallback(() => productApi.getAllProducts(), []);
  const { data: raw, loading, setData } = useCachedFetch(cacheKeyProductsList(), fetchFn, {
    swr: true,
    freshMs: SWR_FRESH_MS,
    staleMs: SWR_STALE_MS,
    ttlMs: DEFAULT_TTL_MS,
    tags: [CACHE_TAGS.PRODUCTS],
    persistSession: true,
  });

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [photosMap, setPhotosMap] = useState({});

  const products = Array.isArray(raw) ? raw : (raw?.content ?? raw?.data ?? []);

  const photoCacheOpts = useMemo(
    () => ({
      swr: true,
      freshMs: SWR_FRESH_MS,
      staleMs: SWR_STALE_MS,
      tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT],
      persistSession: true,
    }),
    []
  );

  const productIdsKey = useMemo(
    () => products.map((p) => p.productId).filter(Boolean).join(','),
    [products]
  );

  useEffect(() => {
    if (!products.length) return;
    let cancelled = false;
    products.forEach((p) => {
      const pid = p.productId;
      if (pid == null) return;
      const key = cacheKeyProductPhotos(pid);
      const snap = peekForDisplay(key);
      if (snap !== undefined) {
        setPhotosMap((prev) =>
          prev[pid] !== undefined ? prev : { ...prev, [pid]: Array.isArray(snap) ? snap : [] }
        );
        return;
      }
      getOrFetch(key, () => productApi.getAllPhotosByProductId(pid), photoCacheOpts)
        .then((data) => {
          if (cancelled) return;
          setPhotosMap((prev) => {
            if (prev[pid] !== undefined) return prev;
            return { ...prev, [pid]: Array.isArray(data) ? data : [] };
          });
        })
        .catch(() => {
          if (cancelled) return;
          setPhotosMap((prev) => ({ ...prev, [pid]: [] }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [productIdsKey, photoCacheOpts]);

  const filtered = products.filter(
    (p) =>
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.productType?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productApi.deleteProduct(id);
      invalidateTags([CACHE_TAGS.PRODUCTS]);
      setData(products.filter((p) => p.productId !== id));
      showToast('Product deleted', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="pl-page">
      <div className="pl-header">
        <div>
          <h2 className="pl-title">Products</h2>
          <p className="pl-subtitle">
            {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Link to="/admin/products/add" className="pl-add-btn">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="pl-search-wrap">
        <Search size={16} className="pl-search-icon" />
        <input
          className="pl-search"
          type="text"
          placeholder="Search by name, type or category…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          disabled={loading}
        />
        {search && (
          <button type="button" className="pl-search-clear" onClick={() => setSearch('')}>
            ×
          </button>
        )}
      </div>

      {loading ? (
        <ProductListSkeleton />
      ) : paginated.length === 0 ? (
        <div className="pl-empty">
          <span style={{ fontSize: 40 }}>📦</span>
          <p>{search ? 'No products match your search.' : 'No products yet.'}</p>
          {!search && (
            <Link to="/admin/products/add" className="pl-add-btn">
              + Add Product
            </Link>
          )}
        </div>
      ) : (
        <div className="pl-grid">
          {paginated.map((p) => (
            <ProductCard key={p.productId} product={p} photos={photosMap[p.productId]} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="pl-pagination">
          <button className="pl-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`pl-page-btn pl-page-btn--num ${currentPage === i + 1 ? 'pl-page-btn--active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="pl-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      <ToastComponent />
    </div>
  );
};

export default ProductList;

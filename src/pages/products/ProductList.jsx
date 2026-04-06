import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { productApi } from '../../api/productApi';
import { useToast } from '../../hooks/useToast';
import './ProductList.css';

const ITEMS_PER_PAGE = 12;

/* ── resolve image src
   Backend returns imageData as raw base64 (no "data:" prefix).
   e.g. "/9j/4AAQSkZJRgAB..." → "data:image/jpeg;base64,/9j/..." ── */
function toImgSrc(imageData, contentType) {
  if (!imageData) return null;
  if (imageData.startsWith('data:') || imageData.startsWith('http')) return imageData;
  return `data:${contentType || 'image/jpeg'};base64,${imageData}`;
}

/* ── Image carousel ── */
const CardCarousel = ({ images }) => {
  const [idx, setIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="pl-card__no-photo">
        <ImageOff size={32} strokeWidth={1.5} />
        <span>No Photo</span>
      </div>
    );
  }

  const prev = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); };

  return (
    <div className="pl-carousel">
      <img src={images[idx].src} alt={images[idx].label} className="pl-carousel__img" />
      {images.length > 1 && (
        <>
          <button className="pl-carousel__arrow pl-carousel__arrow--left" onClick={prev} aria-label="Previous image"><ChevronLeft size={16} /></button>
          <button className="pl-carousel__arrow pl-carousel__arrow--right" onClick={next} aria-label="Next image"><ChevronRight size={16} /></button>
          <div className="pl-carousel__dots">
            {images.map((_, i) => (
              <span key={i} className={`pl-carousel__dot ${i === idx ? 'pl-carousel__dot--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }} />
            ))}
          </div>
          <span className="pl-carousel__counter">{idx + 1}/{images.length}</span>
        </>
      )}
      {idx === 0 && <span className="pl-carousel__cover-badge">Cover</span>}
    </div>
  );
};

/* ── Single product card ── */
const ProductCard = ({ product, photos, onDelete }) => {
  // photos is pre-fetched by the parent — array of ProductPhotoResponseDTO
  const images = (photos ?? []).map((p, i) => ({
    src:   toImgSrc(p.imageData, p.contentType),
    label: p.imageType === 'COVERIMAGE' ? 'Cover' : `Photo ${i}`,
    type:  p.imageType,
  })).filter((img) => img.src);

  // Put COVERIMAGE first
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
  const { data: raw, loading, setData } = useFetch(fetchFn);

  const [search,      setSearch]      = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Map of productId → photos array (fetched separately)
  const [photosMap, setPhotosMap] = useState({});

  const products = Array.isArray(raw) ? raw : (raw?.content ?? raw?.data ?? []);

  // Fetch all photos for every product once the product list is loaded
  useEffect(() => {
    if (!products.length) return;
    products.forEach((p) => {
      // Skip if already fetched
      if (photosMap[p.productId] !== undefined) return;
      productApi.getAllPhotosByProductId(p.productId)
        .then((data) => {
          setPhotosMap((prev) => ({ ...prev, [p.productId]: Array.isArray(data) ? data : [] }));
        })
        .catch(() => {
          setPhotosMap((prev) => ({ ...prev, [p.productId]: [] }));
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const filtered = products.filter((p) =>
    p.productName?.toLowerCase().includes(search.toLowerCase()) ||
    p.productType?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productApi.deleteProduct(id);
      setData(products.filter((p) => p.productId !== id));
      showToast('Product deleted', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="pl-page">
      <div className="pl-header">
        <div>
          <h2 className="pl-title">Products</h2>
          <p className="pl-subtitle">{products.length} product{products.length !== 1 ? 's' : ''} total</p>
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
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
        {search && <button className="pl-search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {paginated.length === 0 ? (
        <div className="pl-empty">
          <span style={{ fontSize: 40 }}>📦</span>
          <p>{search ? 'No products match your search.' : 'No products yet.'}</p>
          {!search && <Link to="/admin/products/add" className="pl-add-btn">+ Add Product</Link>}
        </div>
      ) : (
        <div className="pl-grid">
          {paginated.map((p) => (
            <ProductCard
              key={p.productId}
              product={p}
              photos={photosMap[p.productId]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pl-pagination">
          <button className="pl-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`pl-page-btn pl-page-btn--num ${currentPage === i + 1 ? 'pl-page-btn--active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="pl-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      <ToastComponent />
    </div>
  );
};

export default ProductList;

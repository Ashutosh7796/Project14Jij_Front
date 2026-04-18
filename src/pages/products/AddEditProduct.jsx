import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Plus, ImageOff } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { productApi, IMAGE_TYPE } from "../../api/productApi";
import { invalidateTags, invalidateKey, invalidatePrefix } from "../../cache/requestCache";
import { CACHE_TAGS, cacheKeyProductById } from "../../cache/cacheKeys";
import { toProductImgSrc } from "../../utils/productImage";
import "./product.css";

const SECTION_TYPES = [
  { value: "VARIETY_OVERVIEW",       label: "Variety Overview" },
  { value: "TRAITS_CHARACTERISTICS", label: "Traits & Characteristics" },
  { value: "CHARACTERISTICS",        label: "Characteristics" },
  { value: "AGRONOMY",               label: "Agronomy" },
  { value: "REGISTRATION",           label: "Registration" },
  { value: "DOWNLOAD",               label: "Download" },
];
const EMPTY_SECTION = { sectionType: "VARIETY_OVERVIEW", content: [""] };

/* ── Delete confirmation modal ── */
const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="ae-modal-overlay">
    <div className="ae-modal">
      <p className="ae-modal__title">Delete this image?</p>
      <p className="ae-modal__body">This will permanently remove the image. You can upload a new one after.</p>
      <div className="ae-modal__actions">
        <button type="button" className="remove-btn" onClick={onConfirm}>Yes, Delete</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  </div>
);

/* ── small thumb component ── */
const Thumb = ({ src, onRemove, label }) => (
  <div className="ae-thumb">
    {src
      ? <img src={src} alt={label} className="ae-thumb__img" />
      : <div className="ae-thumb__empty"><ImageOff size={20} /></div>
    }
    {onRemove && (
      <button type="button" className="ae-thumb__remove" onClick={onRemove} title="Remove">
        <X size={12} />
      </button>
    )}
    {label && <span className="ae-thumb__label">{label}</span>}
  </div>
);

const AddEditProduct = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [loading, setLoading] = useState(false);

  /* ── delete confirmation modal state ── */
  const [deleteModal, setDeleteModal] = useState(null); // { type: 'cover'|'photo', index?: number }

  /* ── cover image state ── */
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCover, setExistingCover] = useState(null); // { imageId, imageUrl }

  /* ── additional photos state ── */
  // each item: { file: File|null, preview: string, imageId: number|null }
  const [photos, setPhotos] = useState([]);

  const [form, setForm] = useState({
    productName: "", productType: "SEED", category: "RABI",
    price: "", discount: "", productCategoryType: "SEEDS",
    active: true, breed: "",
    sections: [{ ...EMPTY_SECTION }],
  });

  /* ── load in edit mode ── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const data = await productApi.getProductById(id);
        if (data) {
          setForm({
            productName:         data.productName         ?? "",
            productType:         data.productType         ?? "SEED",
            category:            data.category            ?? "RABI",
            price:               data.price               ?? "",
            discount:            data.offers              ?? "",
            productCategoryType: data.productCategoryType ?? "SEEDS",
            active:              data.active              ?? true,
            breed:               data.breed               ?? "",
            sections:            data.sections?.length ? data.sections : [{ ...EMPTY_SECTION }],
          });
        }
        // load existing photos — cover + additional
        const allPhotos = await productApi.getAllPhotosByProductId(id);
        if (allPhotos?.length) {
          // DTO field: imageType (COVERIMAGE | PHOTO), imageData (base64), imageId
          const cover  = allPhotos.find((p) => p.imageType === IMAGE_TYPE.COVER);
          const extras = allPhotos.filter((p) => p.imageType === IMAGE_TYPE.PHOTO);

          if (cover) {
            const src = toProductImgSrc(cover.imageData, cover.contentType);
            setExistingCover({ imageId: cover.imageId, imageUrl: src });
            setCoverPreview(src);
          }
          if (extras.length) {
            setPhotos(extras.map((p) => ({
              file: null,
              preview: toProductImgSrc(p.imageData, p.contentType),
              imageId: p.imageId,
            })));
          }
        }
      } catch (err) {
        showToast("Failed to load product: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── form field handlers ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const addSection    = () => setForm((p) => ({ ...p, sections: [...p.sections, { ...EMPTY_SECTION }] }));
  const removeSection = (i) => setForm((p) => {
    const next = p.sections.filter((_, idx) => idx !== i);
    return { ...p, sections: next.length ? next : [{ ...EMPTY_SECTION }] };
  });
  const updateSectionType    = (i, v) => setForm((p) => { const s = [...p.sections]; s[i] = { ...s[i], sectionType: v }; return { ...p, sections: s }; });
  const updateSectionContent = (i, v) => setForm((p) => { const s = [...p.sections]; s[i] = { ...s[i], content: [v] }; return { ...p, sections: s }; });

  /* ── cover image handlers ── */
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCoverRemove = () => {
    setCoverFile(null);
    setCoverPreview(existingCover?.imageUrl ?? null);
  };

  /* ── additional photos handlers ── */
  const handlePhotosSelect = (e) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, { file, preview: reader.result, imageId: null }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── delete confirmation handlers ── */
  const requestDeleteCover = () => setDeleteModal({ type: 'cover' });
  const requestDeletePhoto = (index) => setDeleteModal({ type: 'photo', index });

  const confirmDelete = async () => {
    const modal = deleteModal;
    setDeleteModal(null);

    if (modal.type === 'cover') {
      if (existingCover?.imageId) {
        try {
          await productApi.deleteProductPhoto(id, existingCover.imageId);
          showToast("Cover image deleted", "success");
        } catch (err) {
          showToast("Failed to delete cover: " + err.message, "error");
          return;
        }
      }
      setCoverFile(null);
      setCoverPreview(null);
      setExistingCover(null);
    } else if (modal.type === 'photo') {
      const photo = photos[modal.index];
      if (photo?.imageId) {
        try {
          await productApi.deleteProductPhoto(id, photo.imageId);
          showToast("Photo deleted", "success");
        } catch (err) {
          showToast("Failed to delete photo: " + err.message, "error");
          return;
        }
      }
      setPhotos((prev) => prev.filter((_, i) => i !== modal.index));
    }
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim()) { showToast("Product name is required", "error"); return; }
    if (!form.price)               { showToast("Price is required", "error"); return; }

    setLoading(true);
    try {
      const cleanSections = form.sections
        .map((s) => ({ sectionType: s.sectionType, content: [String(s.content?.[0] ?? "")] }))
        .filter((s) => s.content[0].trim());

      const payload = {
        productName: form.productName,
        productType: form.productType,
        category:    form.category,
        price:       parseFloat(form.price) || 0,
        offers:      parseFloat(form.discount) || 0,
        active:      form.active,
        sections:    cleanSections.length ? cleanSections : [{ sectionType: "VARIETY_OVERVIEW", content: [""] }],
        // photoDTO is NOT sent in the product payload — photos are uploaded
        // separately via /api/v1/product-photo/upload after the product is saved
      };

      let savedId = id;
      if (id) {
        await productApi.updateProduct(id, payload);
        showToast("Product updated!", "success");
      } else {
        const res = await productApi.createProduct(payload);
        savedId = res?.data?.productId ?? res?.productId;
        if (!savedId) throw new Error("Product saved but no ID returned");
        showToast("Product created!", "success");
      }

      /* ── cover image: upsert via PATCH /product/{productId} with photoType=COVERIMAGE ── */
      if (coverFile && savedId) {
        try {
          await productApi.upsertProductPhotoByProductId(savedId, coverFile, IMAGE_TYPE.COVER);
        } catch (err) {
          showToast("Cover photo failed: " + err.message, "error");
        }
      }

      /* ── additional photos: upload each via POST /upload with photoType=PHOTO ── */
      const newPhotos = photos.filter((p) => p.file); // only newly selected files
      for (const p of newPhotos) {
        try {
          await productApi.uploadProductPhoto(savedId, p.file, IMAGE_TYPE.PHOTO);
        } catch (err) {
          showToast("A photo upload failed: " + err.message, "error");
        }
      }

      invalidateTags([CACHE_TAGS.PRODUCTS]);
      if (id) invalidateKey(cacheKeyProductById(id));
      if (savedId) invalidatePrefix(`GET:/api/v1/product-photo/product/${savedId}`);

      navigate("/admin/products");
    } catch (err) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const previewDesc = useMemo(() => form.sections?.[0]?.content?.[0] ?? "", [form.sections]);

  if (loading && id) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
      {deleteModal && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
      <div className="product-page">
        <h1 className="page-title">Product & Category Management</h1>
        <h2 className="page-subtitle">{id ? "Edit Product" : "Add New Product"}</h2>

        <div className="product-card">
          <form onSubmit={handleSubmit}>

            {/* ── Basic info ── */}
            <div className="grid-2">
              <div className="field">
                <label>Product Name <span className="req">*</span></label>
                <input name="productName" value={form.productName} onChange={handleChange} placeholder="e.g. Wheat DBW 187" required />
              </div>
              <div className="field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="RABI">Rabi</option>
                  <option value="KHARIP">Kharip</option>
                  <option value="SUMMER">Summer</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Price (₹) <span className="req">*</span></label>
                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" step="0.01" min="0" required />
              </div>
              <div className="field">
                <label>Discount (%)</label>
                <input type="number" name="discount" value={form.discount} onChange={handleChange} placeholder="0" min="0" max="100" />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Product Type</label>
                <select name="productCategoryType" value={form.productCategoryType} onChange={handleChange}>
                  <option value="SEEDS">Seeds</option>
                  <option value="FERTILIZERS">Fertilizers</option>
                </select>
              </div>
              <div className="field">
                <label>Status</label>
                <select name="active" value={String(form.active)} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === "true" }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* ── COVER IMAGE ── */}
            <div className="ae-photo-section">
              <div className="ae-photo-section__header">
                <span className="ae-photo-section__icon">🖼️</span>
                <div>
                  <p className="ae-photo-section__title">Cover Image</p>
                  <p className="ae-photo-section__hint">This is the main image shown on the product card. Only one cover image allowed.</p>
                </div>
              </div>

              <div className="ae-cover-row">
                {/* preview box */}
                <div className="ae-cover-preview">
                  {coverPreview
                    ? <img src={coverPreview} alt="cover" className="ae-cover-preview__img" />
                    : <div className="ae-cover-preview__empty"><ImageOff size={28} /><span>No cover image</span></div>
                  }
                </div>

                {/* controls */}
                <div className="ae-cover-controls">
                  <label className="upload-box">
                    <input type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: "none" }} />
                    📤 {coverFile ? "Change Cover" : "Upload Cover"}
                  </label>
                  {coverFile && (
                    <button type="button" className="remove-btn" onClick={handleCoverRemove}>Revert</button>
                  )}
                  {(existingCover || coverFile) && !coverFile && (
                    <button type="button" className="remove-btn" onClick={requestDeleteCover}>Delete Cover</button>
                  )}
                  {coverFile && <p className="ae-filename">✓ {coverFile.name}</p>}
                </div>
              </div>
            </div>

            {/* ── ADDITIONAL PHOTOS ── */}
            <div className="ae-photo-section">
              <div className="ae-photo-section__header">
                <span className="ae-photo-section__icon">📷</span>
                <div>
                  <p className="ae-photo-section__title">Additional Photos</p>
                  <p className="ae-photo-section__hint">Upload multiple product images. Users can browse them with arrows on the card.</p>
                </div>
              </div>

              {/* thumbs row */}
              {photos.length > 0 && (
                <div className="ae-thumbs">
                  {photos.map((p, i) => (
                    <Thumb
                      key={i}
                      src={p.preview}
                      label={`Photo ${i + 1}`}
                      onRemove={() => p.imageId ? requestDeletePhoto(i) : setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  ))}
                </div>
              )}

              <label className="upload-box ae-multi-upload">
                <input type="file" accept="image/*" multiple onChange={handlePhotosSelect} style={{ display: "none" }} />
                <Plus size={14} /> Add Photos
              </label>
            </div>

            {/* ── Content sections ── */}
            <div className="field full">
              <label>Product Content Sections</label>
              {form.sections.map((sec, i) => (
                <div key={i} className="section-block">
                  <div className="grid-2">
                    <div className="field">
                      <label>Section Type</label>
                      <select value={sec.sectionType} onChange={(e) => updateSectionType(i, e.target.value)}>
                        {SECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <button type="button" className="preview-btn" onClick={addSection} style={{ height: 38 }}>+ Add Section</button>
                      <button type="button" className="remove-btn" onClick={() => removeSection(i)} disabled={form.sections.length === 1} style={{ height: 38 }}>Remove</button>
                    </div>
                  </div>
                  <div className="field full">
                    <textarea value={sec.content?.[0] ?? ""} onChange={(e) => updateSectionContent(i, e.target.value)} placeholder="Write section content…" rows={4} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Actions ── */}
            <div className="action-row left-align">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Saving…" : id ? "Update Product" : "Save Product"}
              </button>
              <button type="button" className="cancel-btn" onClick={() => navigate("/admin/products")}>Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <ToastComponent />
    </>
  );
};

export default AddEditProduct;

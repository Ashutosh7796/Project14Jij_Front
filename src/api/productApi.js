import { BASE_URL, getAuthHeaders } from "../config/api";
import { getToken } from "../utils/auth";

/**
 * ImageType enum — must match com.spring.jwt.Enums.ImageType exactly.
 * Valid values: COVERIMAGE | PHOTO
 */
export const IMAGE_TYPE = {
  COVER: "COVERIMAGE",
  PHOTO: "PHOTO",
};

export const productApi = {

  /* ═══════════════════════════════════════════════════════════
     PRODUCT CRUD
  ═══════════════════════════════════════════════════════════ */

  getAllProducts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${BASE_URL}/api/v1/products${query ? `?${query}` : ""}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to fetch products"); }
    return (await res.json()).data;
  },

  getProductById: async (id) => {
    const res = await fetch(`${BASE_URL}/api/v1/products/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to fetch product"); }
    return (await res.json()).data;
  },

  createProduct: async (payload) => {
    const res = await fetch(`${BASE_URL}/api/v1/products/add`, {
      method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to create product"); }
    return res.json();
  },

  updateProduct: async (id, payload) => {
    const res = await fetch(`${BASE_URL}/api/v1/products/${id}`, {
      method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to update product"); }
    return (await res.json()).data;
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${BASE_URL}/api/v1/products/${id}`, {
      method: "DELETE", headers: getAuthHeaders(),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to delete product"); }
    return true;
  },

  /* ═══════════════════════════════════════════════════════════
     PHOTO ENDPOINTS  — ProductPhotoController
     Base: /api/v1/product-photo

     POST   /upload
            @RequestParam Long productId
            @RequestParam ImageType photoType   ← COVERIMAGE | PHOTO
            @RequestParam("photo") MultipartFile photo

     GET    /{imageId}
     GET    /product/{productId}
     GET    /product/{productId}/all
     GET    /product/{productId}/type/{photoType}

     PATCH  /product/{productId}
            @RequestParam("image") MultipartFile image
            @RequestParam ImageType photoType   ← COVERIMAGE | PHOTO  (required, no default)

     PATCH  /{imageId}
            @RequestParam MultipartFile image
  ═══════════════════════════════════════════════════════════ */

  /**
   * Upload a NEW photo.
   * POST /api/v1/product-photo/upload
   *
   * @param {number} productId
   * @param {File}   photoFile
   * @param {string} photoType  — IMAGE_TYPE.COVER ("COVERIMAGE") or IMAGE_TYPE.PHOTO ("PHOTO")
   */
  uploadProductPhoto: async (productId, photoFile, photoType) => {
    if (!photoType) throw new Error("photoType is required: COVERIMAGE or PHOTO");

    const fd = new FormData();
    fd.append("productId", String(productId));
    fd.append("photoType", photoType);
    fd.append("photo",     photoFile);

    // Read token once and attach manually — avoids any header-spread issues
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/v1/product-photo/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to upload photo"); }
    return res.json();
  },

  /**
   * Get single photo by productId (returns first/cover photo).
   * GET /api/v1/product-photo/product/{productId}
   */
  getPhotoByProductId: async (productId) => {
    const res = await fetch(
      `${BASE_URL}/api/v1/product-photo/product/${productId}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) return null;
    const result = await res.json();
    return result.data ?? result;
  },

  /**
   * Get ALL photos for a product (both COVERIMAGE and PHOTO types).
   * GET /api/v1/product-photo/product/{productId}/all
   */
  getAllPhotosByProductId: async (productId) => {
    const res = await fetch(
      `${BASE_URL}/api/v1/product-photo/product/${productId}/all`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) return [];
    const result = await res.json();
    return result.data ?? [];
  },

  /**
   * Get a specific photo type for a product.
   * GET /api/v1/product-photo/product/{productId}/type/{photoType}
   *
   * @param {string} photoType — "COVERIMAGE" or "PHOTO"
   */
  getPhotoByProductIdAndType: async (productId, photoType) => {
    const res = await fetch(
      `${BASE_URL}/api/v1/product-photo/product/${productId}/type/${photoType}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) return null;
    const result = await res.json();
    return result.data ?? null;
  },

  /**
   * Upsert photo by productId — creates on first call, replaces on subsequent.
   * PATCH /api/v1/product-photo/product/{productId}
   *
   * photoType is REQUIRED — the controller has no default value.
   * Pass IMAGE_TYPE.COVER for cover image, IMAGE_TYPE.PHOTO for additional photos.
   *
   * @param {number} productId
   * @param {File}   photoFile
   * @param {string} photoType  — IMAGE_TYPE.COVER or IMAGE_TYPE.PHOTO  (required)
   */
  upsertProductPhotoByProductId: async (productId, photoFile, photoType) => {
    if (!photoType) throw new Error("photoType is required: COVERIMAGE or PHOTO");

    const fd = new FormData();
    fd.append("image",     photoFile);
    fd.append("photoType", photoType);

    // Read token once and attach manually — avoids any header-spread issues
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/v1/product-photo/product/${productId}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to upsert photo"); }
    return res.json();
  },

  /**
   * Replace a photo by imageId (use when you already have the imageId).
   * PATCH /api/v1/product-photo/{imageId}
   *
   * Note: this endpoint does NOT take a photoType param — type is already
   * stored against the imageId on the backend.
   *
   * @param {number} imageId
   * @param {File}   photoFile
   */
  updateProductPhotoByImageId: async (imageId, photoFile) => {
    const fd = new FormData();
    fd.append("image", photoFile);

    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/v1/product-photo/${imageId}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to update photo"); }
    return res.json();
  },

  /**
   * Delete a photo by productId + imageId.
   * DELETE /api/v1/product-photo/{productId}/{imageId}
   */
  deleteProductPhoto: async (productId, imageId) => {
    const res = await fetch(`${BASE_URL}/api/v1/product-photo/product/${productId}/image/${imageId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed to delete photo"); }
    return true;
  },
};

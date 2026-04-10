import React, { useState, useRef } from "react";
import "./FarmerRegistration.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../config/api";
import { getToken, clearAuthData } from "../../../utils/auth";

/* ── inline toast ─────────────────────────────────────────── */
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`fr-toast fr-toast--${toast.type}`} role="alert">
      <span className="fr-toast__message">{toast.message}</span>
      <button className="fr-toast__close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
};

/** Field order for “first error” scroll + summary listing */
const CONFIRM_FIELD_ORDER = [
  "farmerName",
  "place",
  "mobileNumber",
  "village",
  "taluka",
  "district",
  "farmingType",
  "termsAccepted",
];

const UPLOAD_FIELD_ORDER = ["selfie", "signature"];

function buildConfirmFieldErrors(formData) {
  const errors = {};
  if (!String(formData.farmerName || "").trim()) {
    errors.farmerName = "Farmer's name is required.";
  }
  if (!String(formData.place || "").trim()) {
    errors.place = "Place is required.";
  }
  const mobile = String(formData.mobileNumber || "").replace(/\D/g, "");
  if (!mobile || mobile.length !== 10) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number.";
  }
  if (!String(formData.village || "").trim()) {
    errors.village = "Village is required.";
  }
  if (!String(formData.taluka || "").trim()) {
    errors.taluka = "Taluka is required.";
  }
  if (!String(formData.district || "").trim()) {
    errors.district = "District is required.";
  }
  if (!formData.farmingType) {
    errors.farmingType = "Select a type of farming (Irrigated or Rain-fed).";
  }
  if (!formData.termsAccepted) {
    errors.termsAccepted = "You must agree to the terms and conditions.";
  }
  return errors;
}

function firstKeyInOrder(errors, order) {
  return order.find((k) => errors[k]) || null;
}

function formatValidationToast(errors, order) {
  const keys = order.filter((k) => errors[k]);
  if (!keys.length) return "";
  const lines = keys.map((k) => `• ${errors[k]}`);
  if (lines.length <= 5) {
    return `Please fix the following:\n${lines.join("\n")}`;
  }
  const head = lines.slice(0, 4).join("\n");
  const rest = lines.length - 4;
  return `Please fix ${lines.length} issues:\n${head}\n• …and ${rest} more (see highlighted fields below)`;
}


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function FarmerRegistration({
  isEdit = false,
  initialData = {},
  autoAcceptTerms = false,
  scrollToSelfie = false,
  onSuccess,
}) {
const navigate = useNavigate();

useEffect(() => {
  // ✅ MOBILE-ONLY hard reset scroll (iOS + Android safe)
  if (window.matchMedia("(max-width: 768px)").matches) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // extra safety for iOS
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }
}, []);
useEffect(() => {
    // ✅ Disable browser scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
 
    const scrollToTopEverywhere = () => {
      // ✅ Window scroll
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
 
      // ✅ Also scroll all containers which have scrollbar
      const allElements = document.querySelectorAll("*");
      allElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
 
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          el.scrollTop = 0;
        }
      });
    };
 
    // ✅ run immediately
    scrollToTopEverywhere();
 
    // ✅ run again after render (best fix for react-router layouts)
    requestAnimationFrame(() => {
      scrollToTopEverywhere();
    });
 
    // ✅ run again after small delay (some layouts render late)
    const timer = setTimeout(() => {
      scrollToTopEverywhere();
    }, 50);
 
    return () => clearTimeout(timer);
  }, []);

  const [formData, setFormData] = useState({
    // Farmer details
    farmerName: initialData.farmerName || "",
    mobileNumber: initialData.farmerMobile || "",
    alternateMobile: initialData.alternateMobile || "",

    // Address parsing
    place: initialData.address?.split(",")[0]?.trim() || "",
    village: initialData.village || "",
    taluka: initialData.taluka || "",
    district: initialData.district || "",

    // Farm info
    farmingType: initialData.farmInformation || "",
    crops: initialData.cropDetails || [],
    livestock: initialData.livestockDetails || [],
    equipment: initialData.productionEquipment?.[0]?.toLowerCase() || "",

    // Fixed values
    membershipFee: "250",
    termsAccepted: isEdit || autoAcceptTerms,

    // Uploads
    selfieFile: null,
    selfiePreview: null,
    signatureFile: null,
    signaturePreview: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const fieldRefs = useRef({});
  const toastTimerRef = useRef(null);

  // ── inline toast (replaces all alert() calls) ──────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "error", durationMs = 4000) => {
    setToast({ message, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), durationMs);
  };

  const clearFE = (name) =>
    setFieldErrors((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });

  const scheduleScrollToField = (fieldKey) => {
    if (!fieldKey) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = fieldRefs.current[fieldKey];
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        if (typeof el.focus === "function") {
          try {
            el.focus({ preventScroll: true });
          } catch {
            el.focus();
          }
        }
      });
    });
  };

  const applyValidationErrors = (errors, order, toastDuration = 6500, merge = false) => {
    if (merge) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
    } else {
      setFieldErrors(errors);
    }
    const first = firstKeyInOrder(errors, order);
    scheduleScrollToField(first);
    const msg = formatValidationToast(errors, order);
    if (msg) showToast(msg, "error", toastDuration);
  };

  const [surveyId, setSurveyId] = useState(null);
  const [lastSubmittedSurveyId, setLastSubmittedSurveyId] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const employeeSectionRef = useRef(null);
  const canvasRef = useRef(null);
  const signatureInputRef = useRef(null);
  const [showDrawPad, setShowDrawPad] = useState(false);
  const isDrawingRef = useRef(false);
  const signatureCanvasRef = useRef(null);

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.warn("No auth token found");
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      const existingSurveyId = initialData?.surveyId || initialData?.id;

      if (existingSurveyId) {
        setSurveyId(existingSurveyId);
        setIsConfirmed(true);
      }
    }
  }, [isEdit, initialData]);

  useEffect(() => {
    if (scrollToSelfie && isConfirmed && employeeSectionRef.current) {
      setTimeout(() => {
        employeeSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [scrollToSelfie, isConfirmed]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  /* ===================== HANDLERS ===================== */

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearFE(name);
  };

  const handleMultiSelect = (key, value) => {
    setFormData((p) => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter((v) => v !== value)
        : [...p[key], value],
    }));
  };

  /* ===================== CAMERA ===================== */

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (error) {
      showToast("Unable to access camera: " + error.message);
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((p) => ({
          ...p,
          selfieFile: file,
          selfiePreview: reader.result,
        }));
        clearFE("selfie");
        stopCamera();
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg");
  };

  const retakePhoto = () => {
    setFormData((p) => ({
      ...p,
      selfieFile: null,
      selfiePreview: null,
    }));
  };

  // ===================== IMAGE NORMALIZER =====================
  const normalizeImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => (img.src = reader.result);
      reader.readAsDataURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const MAX_W = 800;
        const MAX_H = 600;

        let w = img.width;
        let h = img.height;

        const scale = Math.min(MAX_W / w, MAX_H / h, 1);

        canvas.width = w * scale;
        canvas.height = h * scale;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], "signature.jpg", {
                type: "image/jpeg",
              })
            );
          },
          "image/jpeg",
          0.8
        );
      };
    });

  /* ===================== SIGNATURE UPLOAD HANDLER ===================== */

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast("File size must be less than 5 MB");
      e.target.value = "";
      return;
    }

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      showToast("Only image files are allowed for signature");
      e.target.value = "";
      return;
    }

    normalizeImage(file).then((normalizedFile) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((p) => ({
          ...p,
          signatureFile: normalizedFile,
          signaturePreview: reader.result,
        }));
        clearFE("signature");
      };
      reader.readAsDataURL(normalizedFile);
    });

    e.target.value = "";
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;

    e.preventDefault();

    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    let x, y;

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasEmpty = (canvas) => {
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !pixels.some((p) => p !== 0);
  };

  const saveDrawnSignature = () => {
    const canvas = signatureCanvasRef.current;

    if (isCanvasEmpty(canvas)) {
      showToast("Please draw your signature first");
      return;
    }

    const ctx = canvas.getContext("2d");

    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "source-over";

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "signature.jpg", {
          type: "image/jpeg",
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((p) => ({
            ...p,
            signatureFile: file,
            signaturePreview: reader.result,
          }));
          clearFE("signature");
          setShowDrawPad(false);
        };
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.85
    );
  };

  /* ===================== CONFIRM (CREATE SURVEY) ===================== */

  const handleConfirm = async () => {
    const confirmErrors = buildConfirmFieldErrors(formData);
    if (Object.keys(confirmErrors).length > 0) {
      applyValidationErrors(confirmErrors, CONFIRM_FIELD_ORDER);
      return undefined;
    }

    setFieldErrors({});

    if (surveyId) return surveyId;

    let token;
    try {
      token = getValidToken();
    } catch (error) {
      showToast(error.message);
      return undefined;
    }

    const payload = {
      farmerName: formData.farmerName,
      farmerMobile: formData.mobileNumber,
      village: formData.village,
      landArea: "0",
      address: `${formData.place}, ${formData.village}, ${formData.taluka}, ${formData.district}`,
      taluka: formData.taluka,
      district: formData.district,
      farmInformation: formData.farmingType,
      cropDetails: formData.crops,
      livestockDetails: formData.livestock,
      productionEquipment: formData.equipment
        ? [
            formData.equipment.charAt(0).toUpperCase() +
              formData.equipment.slice(1),
          ]
        : [],
      sampleCollected: true,
    };

    try {
      setIsSubmitting(true);

      const res = await fetch(
        `${BASE_URL}/api/v1/employeeFarmerSurveys/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create survey");

      setSurveyId(json.data.surveyId);
      setIsConfirmed(true);

      // setTimeout(() => {
      //   selfieRef.current?.scrollIntoView({ behavior: "smooth" });
      // }, 100);

      return json.data.surveyId;
    } catch (err) {
      if (
        err.message.includes("Session expired") ||
        err.message.includes("login again")
      ) {
        showToast(err.message + " Redirecting to login…");
        clearAuthData();
        setTimeout(() => { window.location.href = "/"; }, 2000);
      } else {
        showToast(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===================== TOKEN VALIDATION ===================== */

  const getValidToken = () => {
    const token = getToken();
    if (!token) {
      throw new Error("Please login again. No authentication token found.");
    }
    return token;
  };

  /* ===================== SELFIE UPLOAD ===================== */

  const uploadSelfie = async (surveyId) => {
    if (!formData.selfieFile || !surveyId) {
      throw new Error("Selfie or Survey ID missing");
    }

    const token = getValidToken();
    const fd = new FormData();

    // Swagger requires "file"
    fd.append("file", formData.selfieFile);

    const res = await fetch(
      `${BASE_URL}/api/v1/farmer_selfie_Survey/upload?surveyId=${surveyId}&photoType=SELFIE`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Selfie upload failed");

    return json;
  };

  /* ===================== SIGNATURE UPLOAD ===================== */

  const uploadSignature = async (surveyId) => {
    if (!formData.signatureFile || !surveyId) {
      throw new Error("Signature or Survey ID missing");
    }

    const token = getValidToken();
    const fd = new FormData();

    fd.append("file", formData.signatureFile);

    const res = await fetch(
      `${BASE_URL}/api/v1/farmer_selfie_Survey/upload?surveyId=${surveyId}&photoType=SIGNATURE`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Signature upload failed");

    return json;
  };
  const uploadSelfieAndSignature = async (surveyId) => {
    if (!formData.selfieFile || !formData.signatureFile || !surveyId) {
      throw new Error("Selfie, Signature or Survey ID missing");
    }

    const token = getValidToken();
    const fd = new FormData();

    fd.append("selfie", formData.selfieFile);
    fd.append("signature", formData.signatureFile);

    const res = await fetch(
      `${BASE_URL}/api/v1/farmer_selfie_Survey/upload/selfie-signature?surveyId=${surveyId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      }
    );

    const json = await res.json();
    if (!res.ok)
      throw new Error(json.message || "Selfie & Signature upload failed");

    return json;
  };

  const getSelfieBySelfieId = async (selfieId) => {
    const token = getValidToken();

    const res = await fetch(
      `${BASE_URL}/api/v1/farmer_selfie_Survey/${selfieId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json;
  };

  const getSelfieBySurveyId = async (surveyId) => {
    const token = getValidToken();

    const res = await fetch(
      `${BASE_URL}/api/v1/farmer_selfie_Survey/survey/${surveyId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json;
  };
  const updateSelfieBySelfieId = async (selfieId, image) => {
    const token = getValidToken();

    const res = await fetch(
      `${BASE_URL}/api/v1/farmer_selfie_Survey/${selfieId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image }),
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json;
  };

  /* ===================== FINAL SUBMIT ===================== */

  // const handleSubmit = async () => {
  //   try {
  //     setIsSubmitting(true);

  //     let activeSurveyId = surveyId;

  //     if (!activeSurveyId && !isEdit) {
  //       activeSurveyId = await handleConfirm();
  //     }

  //     if (formData.selfieFile && formData.signatureFile) {
  //       await uploadSelfieAndSignature(activeSurveyId);
  //     } else if (formData.selfieFile) {
  //       await uploadSelfie(activeSurveyId);
  //     } else if (formData.signatureFile) {
  //       await uploadSignature(activeSurveyId);
  //     }

  //     setShowSuccessModal(true);
  //     setTimeout(() => {
  //       if (onSuccess) {
  //         onSuccess();
  //       }
  //     }, 800);
  //   } catch (err) {
  //     alert(err.message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      let activeSurveyId = surveyId;

      if (!activeSurveyId && !isEdit) {
        activeSurveyId = await handleConfirm();
        if (activeSurveyId == null) {
          return;
        }
      }

      const uploadErrors = {};
      if (!formData.selfieFile) {
        uploadErrors.selfie = "Take a photo with the farmer (selfie) before saving.";
      }
      if (!formData.signatureFile) {
        uploadErrors.signature = "Add your signature (draw or upload an image) before saving.";
      }
      if (Object.keys(uploadErrors).length > 0) {
        applyValidationErrors(uploadErrors, UPLOAD_FIELD_ORDER, 6500, true);
        return;
      }

      if (formData.selfieFile) {
        await uploadSelfie(activeSurveyId);
      }

      if (formData.signatureFile) {
        await uploadSignature(activeSurveyId);
      }

      setLastSubmittedSurveyId(activeSurveyId);
      setShowSuccessModal(true);
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!window.confirm("Are you sure you want to cancel?")) return;

    stopCamera();
    setSurveyId(null);
    setIsConfirmed(false);
    setShowCamera(false);
    setShowSuccessModal(false);

    setFormData({
      farmerName: "",
      place: "",
      mobileNumber: "",
      alternateMobile: "",
      village: "",
      taluka: "",
      district: "",
      farmingType: "",
      crops: [],
      livestock: [],
      equipment: "",
      membershipFee: "250",
      termsAccepted: false,
      selfieFile: null,
      selfiePreview: null,
      signatureFile: null,
      signaturePreview: null,
    });
  };

  const submitAnotherSurvey = () => {
    setShowSuccessModal(false);
    if (onSuccess) onSuccess();
    handleCancel();
  };

  const proceedToPayment = () => {
    if (!lastSubmittedSurveyId) return;
    setShowSuccessModal(false);
    if (onSuccess) onSuccess();
    navigate(
      `/employee/farmer-payment/${lastSubmittedSurveyId}?farmerName=${encodeURIComponent(formData.farmerName || "")}`
    );
  };

  return (
    <div className="page-container">
      {/* ── inline toast — replaces all alert() calls ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="form-wrapper">
        <div className="form-header">
          <h1 className="form-title">Fill Farmer Survey Forms</h1>
        </div>

        <div className="form-content">
          {/* Farmer Details */}
          <section className="form-section">
            <h2 className="section-title">
              <span className="section-icon">👤</span> Farmer Details
            </h2>
            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">
                  Farmer's Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="farmerName"
                  value={formData.farmerName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={`form-input${fieldErrors.farmerName ? ' input-error' : ''}`}
                  ref={el => fieldRefs.current['farmerName'] = el}
                  disabled={isSubmitting}
                />
                {fieldErrors.farmerName && <span className="field-error-text">{fieldErrors.farmerName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Place <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="place"
                  value={formData.place}
                  onChange={handleInputChange}
                  placeholder="Enter place"
                  className={`form-input${fieldErrors.place ? ' input-error' : ''}`}
                  ref={el => fieldRefs.current['place'] = el}
                  disabled={isSubmitting}
                />
                {fieldErrors.place && <span className="field-error-text">{fieldErrors.place}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="10 digit number"
                  maxLength="10"
                  className={`form-input${fieldErrors.mobileNumber ? ' input-error' : ''}`}
                  ref={el => fieldRefs.current['mobileNumber'] = el}
                  disabled={isSubmitting}
                />
                {fieldErrors.mobileNumber && <span className="field-error-text">{fieldErrors.mobileNumber}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Alternate Mobile Number</label>
                <input
                  type="tel"
                  name="alternateMobile"
                  value={formData.alternateMobile}
                  onChange={handleInputChange}
                  placeholder="10 digit number (optional)"
                  maxLength="10"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
              {/* Village - full width */}
              <div className="form-group full-width">
                <label className="form-label">
                  Village <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  placeholder="Enter village name"
                  className={`form-input${fieldErrors.village ? ' input-error' : ''}`}
                  ref={el => fieldRefs.current['village'] = el}
                  disabled={isSubmitting}
                />
                {fieldErrors.village && <span className="field-error-text">{fieldErrors.village}</span>}
              </div>

              {/* Taluka */}
              <div className="form-group">
                <label className="form-label">
                  Taluka <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="taluka"
                  value={formData.taluka}
                  onChange={handleInputChange}
                  placeholder="Enter taluka"
                  className={`form-input${fieldErrors.taluka ? ' input-error' : ''}`}
                  ref={el => fieldRefs.current['taluka'] = el}
                  disabled={isSubmitting}
                />
                {fieldErrors.taluka && <span className="field-error-text">{fieldErrors.taluka}</span>}
              </div>

              {/* District */}
              <div className="form-group">
                <label className="form-label">
                  District <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                  className={`form-input${fieldErrors.district ? ' input-error' : ''}`}
                  ref={el => fieldRefs.current['district'] = el}
                  disabled={isSubmitting}
                />
                {fieldErrors.district && <span className="field-error-text">{fieldErrors.district}</span>}
              </div>
            </div>
          </section>

          {/* Farm Information */}
          <section className="form-section">
            <h2 className="section-title">
              <span className="section-icon">🌾</span> Farm Information
            </h2>
            <div
              className="form-group"
              ref={(el) => {
                fieldRefs.current.farmingType = el;
              }}
              tabIndex={-1}
            >
              <label className="form-label">
                Type of Farming <span className="required">*</span>
              </label>
              <div className={`radio-group${fieldErrors.farmingType ? ' radio-group-error' : ''}`}>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="farmingType"
                    value="irrigated"
                    checked={formData.farmingType === "irrigated"}
                    onChange={handleInputChange}
                    className="radio-input"
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">Irrigated</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="farmingType"
                    value="rainfed"
                    checked={formData.farmingType === "rainfed"}
                    onChange={handleInputChange}
                    className="radio-input"
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">Rain-fed (Dryland)</span>
                </label>
              </div>
              {fieldErrors.farmingType && <span className="radio-error-text">{fieldErrors.farmingType}</span>}
            </div>
          </section>

          {/* Crop Details */}
          <section className="form-section">
            <h2 className="section-title">
              <span className="section-icon">🌱</span> Crop Details (Annual
              Production)
            </h2>
            <p className="section-subtitle">(Pick the applicable options)</p>
            <div className="grid-3-col">
              {[
                "Cotton",
                "Soybean",
                "Chickpea (Gram)",
                "Sugarcane",
                "Wheat",
                "Maize",
                "Other",
              ].map((crop) => (
                <label key={crop} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.crops.includes(crop)}
                    onChange={() => handleMultiSelect("crops", crop)}
                    className="checkbox-input"
                    disabled={isSubmitting}
                  />
                  <span className="checkbox-text">{crop}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Livestock Details */}
          <section className="form-section">
            <h2 className="section-title">
              <span className="section-icon">🐄</span> Livestock Details
            </h2>
            <p className="section-subtitle">(Select the livestock you own)</p>
            <div className="grid-4-col">
              {["Cow", "Buffalo", "Goats", "Bullocks / Oxen Pair"].map(
                (animal) => (
                  <label key={animal} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.livestock.includes(animal)}
                      onChange={() => handleMultiSelect("livestock", animal)}
                      className="checkbox-input"
                      disabled={isSubmitting}
                    />
                    <span className="checkbox-text">{animal}</span>
                  </label>
                )
              )}
            </div>
          </section>

          {/* Production Equipment */}
          <section className="form-section">
            <h2 className="section-title">
              <span className="section-icon">🚜</span> Do you have production
              equipment?
            </h2>
            <div className="radio-group">
              {["Tractor", "Rotavator", "Plough", "None"].map((item) => (
                <label key={item} className="radio-label">
                  <input
                    type="radio"
                    name="equipment"
                    value={item.toLowerCase()}
                    checked={formData.equipment === item.toLowerCase()}
                    onChange={handleInputChange}
                    className="radio-input"
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">{item}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Membership Fee */}
          <section
            className="form-section"
            style={{
              backgroundColor: "#eef7f1",
              border: "1px solid #cfe8d6",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h2
              className="section-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",

                color: "#0f0f0fff",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "14px",
              }}
            >
              <span className="section-icon" style={{ color: "#131212ff" }}>
                🎓
              </span>
              Membership Fee
            </h2>

            <div
              className="fee-box"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <div
                className="fee-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span className="fee-label">Membership Fee:</span>

                <div style={{ textAlign: "right" }}>
                  <div
                    className="fee-amount"
                    style={{ fontWeight: "600", fontSize: "20px" }}
                  >
                    ₹250/-
                  </div>
                  <div
                    className="fee-description"
                    style={{ fontSize: "14px", color: "#6b7280" }}
                  >
                    (In words: Rupees Two Hundred Fifty Only)
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="form-section">
            <h2
              className="section-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "12px",
              }}
            >
              <span style={{ color: "#2f8f46", fontSize: "22px" }}>🎁</span>
              Benefits of Registration
            </h2>

            <div
              style={{
                border: "1px solid #d9efe1",
                borderRadius: "14px",
                padding: "18px",
                backgroundColor: "#f9fdfb",
              }}
            >
              {[
                "Workshops by trained agricultural experts.",
                "Guidance on modern farming techniques.",
                "Practical field-based demonstrations.",
                "Special organic gift and seeds collection worth ₹300/- for registered farmers.",
              ].map((text, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: index !== 3 ? "14px" : "0",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      minWidth: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#2f8f46",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>

                  <span
                    style={{
                      color: "#374151",
                      fontSize: "15px",
                      lineHeight: "1.5",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Terms & Conditions */}
          <section className="form-section">
            <h2 className="section-title">
              <span className="section-icon">📄</span>
              Terms & Conditions
            </h2>

            <div className="terms-box">
              <p className="terms-text">
                • Jioji company reserves the right to make changes to its
                policies.
              </p>
              <p className="terms-text">
                • In case of any legal dispute, jurisdiction shall be limited to
                Chhatrapati Sambhajinagar (Aurangabad) Court only.
              </p>
            </div>

            <br />

            <div
              ref={(el) => {
                fieldRefs.current.termsAccepted = el;
              }}
              tabIndex={-1}
              className={fieldErrors.termsAccepted ? "fr-scroll-anchor fr-scroll-anchor--error" : "fr-scroll-anchor"}
            >
              <label className="checkbox-label terms-checkbox">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">
                  I agree to the terms and conditions{" "}
                  <span className="required">*</span>
                </span>
              </label>
              {fieldErrors.termsAccepted && (
                <span className="radio-error-text">{fieldErrors.termsAccepted}</span>
              )}
            </div>

            {/* Confirm Button */}
            {formData.termsAccepted && !isConfirmed && (
              <div className="confirm-btn-wrapper">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn btn-primary confirm-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="fr-btn-loading">
                      <span className="fr-spinner" /> Confirming…
                    </span>
                  ) : "Confirm"}
                </button>
                {isSubmitting && (
                  <p className="fr-confirm-hint">Saving farmer details, please wait…</p>
                )}
              </div>
            )}
          </section>

          {/* Selfie Upload Section with Camera */}
          {/* Employee Section */}
          {formData.termsAccepted && isConfirmed && (
            <section
              ref={employeeSectionRef}
              className="form-section employee-section"
            >
              <h2 className="section-title">
                <span className="section-icon">📷</span>
                Employee Section
              </h2>

              <div className="employee-grid">
                {/* Employee Code */}
                {/* <div className="employee-field">
                <label>Employee Code:</label>
              <input
                type="text"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleInputChange}
                placeholder="Enter employee code"
                className="form-input"
                disabled={isSubmitting}
              />

              </div> */}

                {/* Photo with Farmer */}
                <div
                  className={`employee-field${fieldErrors.selfie ? " employee-field--error" : ""}`}
                  ref={(el) => {
                    fieldRefs.current.selfie = el;
                  }}
                  tabIndex={-1}
                >
                  <label>Photo with Farmer (Selfie)</label>

                  {!showCamera && !formData.selfiePreview && (
                    <div className="dotted-card" onClick={startCamera}>
                      <span className="camera-icon">📷</span>
                      <p>
                        Take Selfie
                        <br />
                        with Farmer
                      </p>
                    </div>
                  )}

                  {showCamera && (
                    <div className="camera-container">
                      <video ref={videoRef} autoPlay playsInline />
                      <div className="camera-actions">
                        <button
                          className="btn btn-primary"
                          onClick={capturePhoto}
                        >
                          Capture
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={stopCamera}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.selfiePreview && (
                    <div className="preview-container">
                      <img src={formData.selfiePreview} alt="Selfie" />
                      <button
                        className="btn btn-secondary"
                        onClick={retakePhoto}
                      >
                        Retake
                      </button>
                    </div>
                  )}

                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {fieldErrors.selfie && (
                    <span className="field-error-text">{fieldErrors.selfie}</span>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div
                className={`signature-section${fieldErrors.signature ? " signature-section--error" : ""}`}
                ref={(el) => {
                  fieldRefs.current.signature = el;
                }}
                tabIndex={-1}
              >
                <label>Employee Signature:</label>
                {fieldErrors.signature && (
                  <span className="field-error-text">{fieldErrors.signature}</span>
                )}

                <div className="signature-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDrawPad(true)}
                  >
                    ✍ Draw
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setShowDrawPad(false);
                      signatureInputRef.current.click();
                    }}
                  >
                    📤 Upload Photo
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={signatureInputRef}
                    onChange={handleSignatureUpload}
                  />
                </div>

                <div className="dotted-card large">
                  {/* DRAW PAD */}
                  {showDrawPad && !formData.signaturePreview && (
                    <div style={{ marginTop: "12px" }}>
                      <canvas
                        ref={signatureCanvasRef}
                        width={500}
                        height={220}
                        style={{
                          border: "1px solid #ccc",
                          background: "#fff",
                          borderRadius: "6px",
                          touchAction: "none",
                        }}
                        onMouseDown={() => (isDrawingRef.current = true)}
                        onMouseUp={() => (isDrawingRef.current = false)}
                        onMouseLeave={() => (isDrawingRef.current = false)}
                        onMouseMove={draw}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          isDrawingRef.current = true;
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          isDrawingRef.current = false;
                        }}
                        onTouchMove={draw}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={saveDrawnSignature}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={clearCanvas}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* IMAGE PREVIEW */}
                  {formData.signaturePreview && (
                    <>
                      <img
                        src={formData.signaturePreview}
                        alt="Signature"
                        style={{
                          display: "block",
                          margin: "0 auto",
                          maxWidth: "100%",
                          maxHeight: "220px",
                          objectFit: "contain",
                          borderRadius: "6px",
                        }}
                      />
                      <small
                        style={{
                          color: "#6b7280",
                          display: "block",
                          marginTop: "6px",
                          textAlign: "center",
                        }}
                      >
                        File size:{" "}
                        {(formData.signatureFile.size / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </small>
                    </>
                  )}

                  {/* PDF PREVIEW */}
                  {formData.signatureFile?.type === "application/pdf" && (
                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                      📄 <strong>{formData.signatureFile.name}</strong>
                      <br />
                      <small>
                        {(formData.signatureFile.size / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </small>
                    </div>
                  )}
                </div>

                <button
                  className="btn-clear"
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      signatureFile: null,
                      signaturePreview: null,
                    }))
                  }
                >
                  ⟲ Clear
                </button>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className="button-group">
            <button
              type="button"
              onClick={handleSubmit}
              className={`btn btn-primary ${
                !formData.termsAccepted || !isConfirmed || isSubmitting
                  ? "btn-disabled"
                  : ""
              }`}
              disabled={!formData.termsAccepted || !isConfirmed || isSubmitting}
            >
              {isSubmitting ? "SUBMITTING..." : "SAVE DATA"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="success-icon">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle
                  className="checkmark-circle"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className="checkmark-check"
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <h2 className="modal-title">Survey Submitted!</h2>
            <p className="modal-message">
              Thank you{" "}
              <span className="highlight-name">{formData.farmerName}</span> for
              completing the survey.
            </p>
            <div className="modal-buttons">
              <button
                onClick={submitAnotherSurvey}
                className="btn btn-primary modal-btn"
              >
                Submit Another Survey
              </button>
              <button
                onClick={proceedToPayment}
                className="btn btn-secondary modal-btn"
                style={{ marginLeft: 8 }}
              >
                Proceed To Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useMemo, useState, useLayoutEffect } from "react";
 
import emailjs from "@emailjs/browser";
import { ImFacebook2 } from "react-icons/im";
import { BsTwitterX, BsYoutube } from "react-icons/bs";
import { FaInstagramSquare } from "react-icons/fa";
import { IoCallSharp } from "react-icons/io5";
import { MdAttachEmail } from "react-icons/md";
import { FaLocationDot } from "react-icons/fa6";
import { useToast } from "../../hooks/useToast";
 
// ✅ Update path as per your project structure
import jiojiLogo from "../../assets/Jioji_logo.png";
 
const INITIAL_FORM = {
  name: "",
  contactnumber: "",
  address: "",
  message: "", // OPTIONAL
};
 
export default function ContactUs() {
  const { showToast, ToastComponent } = useToast();
  
  useLayoutEffect(() => {
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
 
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({
    name: false,
    contactnumber: false,
    address: false,
    message: false,
  });
  const [errors, setErrors] = useState({});
 
  const validators = useMemo(
    () => ({
      name: (v) => {
        const value = String(v || "").trim();
        if (!value) return "Name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        return "";
      },
 
      contactnumber: (v) => {
        const value = String(v || "").trim();
        if (!value) return "Contact number is required";
        if (!/^[6-9]\d{9}$/.test(value)) return "Enter a valid 10-digit mobile number";
        return "";
      },
 
      address: (v) => {
        const value = String(v || "").trim();
        if (!value) return "Address is required";
        if (value.length < 10) return "Address must be at least 10 characters";
        return "";
      },
 
      // ✅ OPTIONAL message
      message: (v) => {
        const value = String(v || "").trim();
        if (!value) return "";
        if (value.length < 10) return "Message must be at least 10 characters (or leave it empty)";
        if (value.length > 500) return "Message must be 500 characters or less";
        return "";
      },
    }),
    []
  );
 
  const validateAll = (data) => {
    const nextErrors = {};
    Object.keys(validators).forEach((key) => {
      const msg = validators[key](data[key]);
      if (msg) nextErrors[key] = msg;
    });
    return nextErrors;
  };
 
  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
 
    setErrors((prev) => {
      const msg = validators[name]?.(value) || "";
      if (!msg) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: msg };
    });
  };
 
  //   const onChange = (e) => setField(e.target.name, e.target.value);
  const onChange = (e) => {
    const { name, value } = e.target;
 
    // ✅ Name: allow only alphabets and spaces
    if (name === "name") {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }
 
    // ✅ Contact number: allow only digits
    if (name === "contactnumber") {
      if (!/^\d*$/.test(value)) return;
    }
 
    setField(name, value);
  };
 
  const onBlur = (e) => {
    const name = e.target.name;
    setTouched((t) => ({ ...t, [name]: true }));
 
    setErrors((prev) => {
      const msg = validators[name]?.(form[name]) || "";
      if (!msg) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: msg };
    });
  };
 
  const onSubmit = (e) => {
    e.preventDefault();
 
    setTouched({
      name: true,
      contactnumber: true,
      address: true,
      message: true,
    });
 
    const nextErrors = validateAll(form);
    setErrors(nextErrors);
 
    if (Object.keys(nextErrors).length > 0) return;
 
    const templateParams = {
      name: form.name,
      contactnumber: form.contactnumber,
      address: form.address,
      message: form.message || "No message provided",
      to_email: "abhishekwadile04@gmail.com",
    };
 
    emailjs
      .send(
        "service_qrxnupf", // SERVICE ID
        "template_cbf8uz5", // TEMPLATE ID
        templateParams,
        "YDkdpHom_T2MuTgKA" //PUBLIC ID
      )
      .then(
        () => {
          showToast("Message sent successfully!", "success");
          setForm(INITIAL_FORM);
          setErrors({});
          setTouched({
            name: false,
            contactnumber: false,
            address: false,
            message: false,
          });
        },
        (error) => {
          console.error("Email error:", error);
          showToast("Failed to send message. Please try again.", "error");
        }
      );
  };
 
  const showErr = (field) => touched[field] && errors[field];
 
  const inputErrStyle = (field) =>
    showErr(field)
      ? { border: "1px solid rgba(239,68,68,0.9)", boxShadow: "0 0 0 4px rgba(239,68,68,0.10)" }
      : {};
 
  return (
    <div style={page}>
      <div style={card}>
        {/* ✅ Back Button */}
        <div style={headerTopRow}>
          <button type="button" style={backBtn} onClick={() => window.history.back()}>
            Back
          </button>
        </div>
 
        {/* Header */}
        <div style={brandRow}>
          <div style={brandIcon}>
            <img
              src={jiojiLogo}
              alt="Jioji Green India"
              style={{
                width: 34,
                height: 34,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
 
          <div>
            <div style={brandTitle}>Jioji Green India</div>
            <div style={brandSub}>
              Your trusted partner for quality farm products. We deliver certified seeds, fertilizers, and tools to
              farmers across India.
            </div>
          </div>
        </div>
 
        {/* Contact details */}
        <div style={infoList}>
          <div style={infoRow}>
            <span style={infoIcon}>
              <IoCallSharp />
            </span>
            <a
              href="tel:+919766722922"
              style={{
                ...infoText,
                textDecoration: "none",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              +91 97667 22922
            </a>
          </div>
 
          <div style={infoRow}>
            <span style={infoIcon}>
              <MdAttachEmail />
            </span>
            <a
              href="mailto:sales@jiojigreenindia.com"
              style={{
                ...infoText,
                textDecoration: "none",
                color: "#6f1d8f",
                cursor: "pointer",
              }}
            >
              sales@jiojigreenindia.com
            </a>
          </div>
 
          <div style={infoRow}>
            <span style={infoIcon}>
              <FaLocationDot />
            </span>
            <span style={infoText}>
              431007 SainathVilla Sundrwadi Chatrapati Sambhajinagar
              <br />
              Near Cambridge School, 5star MIDC, Airport Road
            </span>
          </div>
        </div>
 
        {/* Social */}
        <div style={socialRow}>
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            style={socBtn}
          >
            <ImFacebook2 />
          </a>
 
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            style={socBtn}
          >
            <BsTwitterX />
          </a>
 
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={socBtn}
          >
            <FaInstagramSquare />
          </a>
 
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            style={socBtn}
          >
            <BsYoutube />
          </a>
        </div>
 
        <div style={divider} />
 
        {/* Form */}
        <div style={{ marginTop: 14 }}>
          <div style={formTitle}>Send us a message</div>
 
          <form onSubmit={onSubmit} style={formWrap} noValidate>
            <div style={fieldWrap}>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Your Full Name"
                style={{ ...inputStyle, ...inputErrStyle("name") }}
              />
              {showErr("name") ? <div style={errText}>{errors.name}</div> : null}
            </div>
 
            <div style={fieldWrap}>
              <input
                name="contactnumber"
                value={form.contactnumber}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Your Contact Number"
                inputMode="numeric"
                maxLength={10}
                style={{ ...inputStyle, ...inputErrStyle("contactnumber") }}
              />
              {showErr("contactnumber") ? <div style={errText}>{errors.contactnumber}</div> : null}
            </div>
 
            <div style={fieldWrap}>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Your Full Address"
                style={{ ...inputStyle, ...inputErrStyle("address") }}
              />
              {showErr("address") ? <div style={errText}>{errors.address}</div> : null}
            </div>
 
            <div style={fieldWrap}>
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Your Message (Optional)"
                rows={4}
                style={{
                  ...inputStyle,
                  ...inputErrStyle("message"),
                  resize: "vertical",
                  paddingTop: 10,
                  height: "auto",
                  minHeight: 110,
                }}
              />
              <div style={helpRow}>
                <span style={helpText}>Optional (max 500 characters).</span>
                <span style={helpText}>{(form.message || "").length}/500</span>
              </div>
              {showErr("message") ? <div style={errText}>{errors.message}</div> : null}
            </div>
 
            <button type="submit" style={buttonStyle}>
              Send Message
            </button>
          </form>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
}
 
/* Styles */
const page = {
  padding: "28px 16px",
  background: "#f6f7fb",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};
 
const card = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 14px 30px rgba(17,24,39,0.10)",
  border: "1px solid rgba(229,231,235,0.9)",
};
 
const headerTopRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};
 
const backBtn = {
  border: "1px solid rgba(111, 29, 143, 0.22)",
  background: "rgba(111, 29, 143, 0.08)",
  color: "#6f1d8f",
  fontWeight: 900,
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: 12,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};
 
const brandRow = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
};
 
const brandIcon = {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(111,29,143,0.08)",
  border: "1px solid rgba(111,29,143,0.14)",
  flexShrink: 0,
};
 
const brandTitle = {
  fontSize: 22,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.1,
};
 
const brandSub = {
  marginTop: 6,
  fontSize: 13,
  lineHeight: 1.6,
  color: "#6b7280",
  maxWidth: 460,
};
 
const infoList = {
  marginTop: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
 
const infoRow = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  color: "#111827",
};
 
const infoIcon = {
  width: 30,
  height: 30,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "rgba(17,24,39,0.04)",
  border: "1px solid rgba(229,231,235,0.9)",
  color: "#6f1d8f",
  flexShrink: 0,
  marginTop: 1,
};
 
const infoText = {
  fontSize: 13,
  lineHeight: 1.6,
  color: "#374151",
};
 
const socialRow = {
  marginTop: 14,
  display: "flex",
  gap: 10,
};
 
const socBtn = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(229,231,235,0.9)",
  background: "#fff",
  color: "#6f1d8f",
  textDecoration: "none",
  boxShadow: "0 10px 18px rgba(17,24,39,0.06)",
};
 
const divider = {
  marginTop: 16,
  borderTop: "1px solid rgba(229,231,235,0.95)",
};
 
const formTitle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#111827",
  marginBottom: 10,
};
 
const formWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
 
const fieldWrap = {
  display: "flex",
  flexDirection: "column",
};
 
const inputStyle = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "0 12px",
  outline: "none",
  fontSize: 13,
  background: "#fff",
};
 
const errText = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#ef4444",
};
 
const helpRow = {
  marginTop: 6,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};
 
const helpText = {
  fontSize: 12,
  color: "#6b7280",
};
 
const buttonStyle = {
  height: 44,
  border: "none",
  background: "linear-gradient(90deg, #6f1d8f, #8f3aa7)",
  color: "#fff",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
};
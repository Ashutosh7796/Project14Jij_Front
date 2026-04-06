import React, { useMemo, useState, useLayoutEffect } from "react";
 
const seedsData = [
  {
    id: 1,
    name: "Wheat Seeds",
    description:
      "High-yield wheat seeds suitable for diverse soil conditions. These seeds offer excellent resistance to common diseases and ensure strong crop growth.",
  },
  {
    id: 2,
    name: "Rice Seeds",
    description:
      "Premium quality rice seeds designed for high productivity and better grain quality. Ideal for both irrigated and rain-fed areas.",
  },
  {
    id: 3,
    name: "Corn (Maize) Seeds",
    description:
      "Hybrid maize seeds that provide uniform growth, high yield potential, and excellent adaptability to various climates.",
  },
  {
    id: 4,
    name: "Vegetable Seeds",
    description:
      "A wide range of vegetable seeds including tomato, onion, brinjal, and chilli. Ensures healthy crops and better market value.",
  },
  {
    id: 5,
    name: "Pulses Seeds",
    description:
      "High-quality pulse seeds such as lentils and chickpeas that enrich soil fertility and provide excellent nutritional value.",
  },
  {
    id: 6,
    name: "Oilseed Crops",
    description:
      "Oilseed varieties like sunflower and mustard that deliver high oil content and strong disease resistance.",
  },
  {
    id: 7,
    name: "Cotton Seeds",
    description:
      "High-performance cotton seeds with strong pest tolerance and uniform boll development. Suitable for long-season cultivation with better fibre quality and yield stability.",
  },
  {
    id: 8,
    name: "Groundnut (Peanut) Seeds",
    description:
      "Premium groundnut seeds with excellent germination and strong pod filling. Ideal for higher oil content and improved resistance to common soil-borne diseases.",
  },
];
 
export default function Seeds() {
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
 
  const styles = useMemo(
    () => ({
      page: {
        background: "#f6f7fb",
        padding: "12px 12px 16px",
        width: "100%",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        color: "#111827",
      },
 
      wrap: {
        maxWidth: 1100,
        margin: "0 auto",
      },
 
      header: {
        borderRadius: 16,
        padding: "18px 18px",
        background: "linear-gradient(90deg, #6f1d8f, #8f3aa7)", // theme [web:353]
        color: "#fff",
        boxShadow: "0 14px 30px rgba(17,24,39,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
      },
 
      headerTopRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 6,
      },
 
      backBtn: {
        border: "1px solid rgba(255,255,255,0.30)",
        background: "rgba(255,255,255,0.14)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 13,
        padding: "8px 12px",
        borderRadius: 12,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      },
 
      title: {
        margin: 0,
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: 0.2,
      },
 
      subtitle: {
        margin: "6px 0 0",
        opacity: 0.92,
        fontSize: 13,
        lineHeight: 1.6,
        maxWidth: 860,
      },
 
      grid: {
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
      },
 
      card: {
        background: "#ffffff",
        padding: 16,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 30px rgba(17,24,39,0.08)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
      },
 
      cardHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 18px 38px rgba(17,24,39,0.12)",
      },
 
      cardTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 10,
      },
 
      cardTitle: {
        margin: 0,
        fontSize: 16,
        fontWeight: 900,
        color: "#111827",
        lineHeight: 1.35,
      },
 
      badge: {
        flexShrink: 0,
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(111, 29, 143, 0.10)",
        border: "1px solid rgba(111, 29, 143, 0.16)",
        color: "#6f1d8f",
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      },
 
      description: {
        margin: 0,
        fontSize: 14,
        color: "#374151",
        lineHeight: 1.75,
      },
 
      actionRow: {
        marginTop: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      },
 
      ghostBtn: {
        border: "1px solid rgba(111, 29, 143, 0.22)",
        background: "rgba(111, 29, 143, 0.06)",
        color: "#6f1d8f",
        fontWeight: 900,
        fontSize: 13,
        padding: "9px 12px",
        borderRadius: 12,
        cursor: "pointer",
      },
 
      primaryBtn: {
        border: 0,
        background: "linear-gradient(90deg, #6f1d8f, #8f3aa7)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 13,
        padding: "9px 12px",
        borderRadius: 12,
        cursor: "pointer",
      },
    }),
    []
  );
 
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        {/* Purple header */}
        <div style={styles.header}>
          {/* ✅ Back Button */}
          <div style={styles.headerTopRow}>
            <button
              type="button"
              style={styles.backBtn}
              onClick={() => window.history.back()}
            >
               Back
            </button>
          </div>
 
          <h2 style={styles.title}>Seeds Collection</h2>
          <p style={styles.subtitle}>
            Explore our wide range of certified and high-quality agricultural
            seeds.
          </p>
        </div>
 
        {/* Cards */}
        <div style={styles.grid}>
          {seedsData.map((seed) => (
            <SeedCard key={seed.id} seed={seed} styles={styles} />
          ))}
        </div>
      </div>
    </div>
  );
}
 
function SeedCard({ seed, styles }) {
  const [hover, setHover] = useState(false);
 
  return (
    <div
      style={{ ...styles.card, ...(hover ? styles.cardHover : null) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={styles.cardTop}>
        <h3 style={styles.cardTitle}>{seed.name}</h3>
        <span style={styles.badge}>Certified</span>
      </div>
 
      <p style={styles.description}>{seed.description}</p>
    </div>
  );
}
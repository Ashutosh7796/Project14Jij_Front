import React, { useMemo, useLayoutEffect } from "react";
import farmerImg from "../../assets/farmer.webp";
 
export default function AboutUs() {
  useLayoutEffect(() => {
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
 
  const styles = useMemo(
    () => ({
      page: {
        background: "#f6f7fb",
        minHeight: "100vh",
        padding: "28px 16px",
        width: "100%",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        color: "#111827",
      },
 
      wrap: {
        maxWidth: "980px",
        margin: "0 auto",
      },
 
      header: {
        borderRadius: 16,
        padding: 18,
        background: "linear-gradient(90deg, #6f1d8f, #8f3aa7)",
        color: "#fff",
        boxShadow: "0 14px 30px rgba(17,24,39,0.1)",
      },
 
      headerTopRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
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
        fontSize: 34,
        fontWeight: 900,
        lineHeight: 1.1,
      },
 
      subtitle: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 1.7,
        opacity: 0.95,
      },
 
      card: {
        marginTop: 16,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 30px rgba(17,24,39,0.08)",
        padding: 20,
      },
 
      p: {
        marginBottom: 12,
        fontSize: 15,
        lineHeight: 1.8,
      },
 
      pMuted: {
        marginBottom: 10,
        fontSize: 14,
        lineHeight: 1.7,
        color: "#374151",
      },
 
      sectionTitle: {
        margin: "12px 0 6px",
        fontSize: 16,
        fontWeight: 900,
      },
 
      divider: {
        height: 1,
        background: "#e5e7eb",
        margin: "12px 0",
      },
 
      missionBlock: {
        marginBottom: 6,
      },
 
      missionWrap: {
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        flexWrap: "wrap", // ✅ mobile responsive
      },
 
      missionLeft: {
        flex: "1 1 55%",
      },
 
      missionRight: {
        flex: "1 1 45%",
      },
 
      image: {
        width: "100%",
        height: "260px",
        objectFit: "cover",
        borderRadius: 20,
        display: "block",
        boxShadow: "0 10px 18px rgba(0,0,0,0.15)",
      },
 
      list: {
        margin: 0,
        paddingLeft: 18,
        fontSize: 14,
        lineHeight: 1.8,
        color: "#374151",
      },
 
      promiseTitle: {
        marginTop: 8,
        marginBottom: 6,
        fontSize: 16,
        fontWeight: 900,
      },
    }),
    []
  );
 
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
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
 
          <h1 style={styles.title}>
            We Believe In Natural <br />
            Goodness
          </h1>
          <p style={styles.subtitle}>
            Wholesome, responsibly sourced products—built with farmers, for
            families, with purity and sustainability at the center.
          </p>
        </div>
 
        <div style={styles.card}>
          <p style={styles.p}>
            At <strong>Jioji Green</strong>, we believe in working hand-in-hand
            with accredited farmers who share our values of quality, purity, and
            sustainability.
          </p>
 
          <div style={styles.divider} />
 
          <p style={styles.p}>
            Our commitment goes beyond products—we bring nature’s best in its
            purest form.
          </p>
 
          <div style={styles.missionBlock}>
            <div style={styles.missionWrap}>
              <div style={styles.missionLeft}>
                <h3 style={styles.sectionTitle}>Our Mission</h3>
                <p style={styles.pMuted}>
                  To improve agricultural productivity by providing certified,
                  affordable, and reliable farming products across India.
                </p>
 
                <h3 style={styles.sectionTitle}>What We Offer</h3>
                <ul style={styles.list}>
                  <li>High-quality seeds and fertilizers</li>
                  <li>Expert agricultural guidance</li>
                  <li>Fast and reliable delivery</li>
                  <li>Farmer-focused support</li>
                </ul>
              </div>
 
              <div style={styles.missionRight}>
                <img src={farmerImg} alt="Farmer" style={styles.image} />
              </div>
            </div>
          </div>
 
          <h3 style={styles.promiseTitle}>Our Promise</h3>
          <p style={styles.pMuted}>
            We believe in transparency, trust, and long-term relationships with
            farmers. Your growth is our success.
          </p>
        </div>
      </div>
    </div>
  );
}
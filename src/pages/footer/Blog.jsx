import React, { useMemo, useLayoutEffect } from "react";
 
const blogPosts = [
  {
    id: 1,
    title: "How Modern Farming is Changing India",
    date: "March 10, 2025",
    description:
      "Modern farming techniques such as precision agriculture, automation, and data-driven decision-making are transforming Indian agriculture. Farmers can now monitor soil health, weather patterns, and crop growth using smart tools, leading to higher productivity and reduced wastage.",
  },
  {
    id: 2,
    title: "Best Fertilizers for Healthy Crops",
    date: "March 5, 2025",
    description:
      "Choosing the right fertilizer is essential for crop health. Organic and chemical fertilizers each play a vital role depending on soil quality and crop type. Balanced nutrients ensure strong roots, better yield, and disease resistance.",
  },
  {
    id: 3,
    title: "Smart Irrigation Techniques",
    date: "February 28, 2025",
    description:
      "Smart irrigation systems help farmers conserve water while maximizing crop output. Techniques like drip irrigation, sprinkler systems, and sensor-based watering reduce wastage and ensure optimal soil moisture.",
  },
  {
    id: 4,
    title: "Importance of Soil Testing Before Cultivation",
    date: "February 20, 2025",
    description:
      "Soil testing helps farmers understand nutrient levels, pH balance, and soil health. With accurate soil data, farmers can choose the right crops and fertilizers, leading to improved productivity and sustainable farming practices.",
  },
  {
    id: 5,
    title: "Role of Technology in Modern Agriculture",
    date: "February 12, 2025",
    description:
      "Technology such as AI, IoT, and drones is revolutionizing agriculture. These tools help monitor crop health, predict yields, detect diseases early, and optimize resource usage, making farming smarter and more efficient.",
  },
  {
    id: 6,
    title: "Organic Farming: Benefits and Challenges",
    date: "February 5, 2025",
    description:
      "Organic farming focuses on natural methods without synthetic chemicals. While it improves soil health and produces healthier food, it also requires careful planning, proper composting, and pest management techniques.",
  },
];
 
export default function Blog() {
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
        padding: "28px 16px",
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
        background: "linear-gradient(90deg, #6f1d8f, #8f3aa7)",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      },
 
      card: {
        background: "#ffffff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 30px rgba(17,24,39,0.08)",
        padding: 16,
        transition: "transform 160ms ease, box-shadow 160ms ease",
      },
 
      cardHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 18px 38px rgba(17,24,39,0.12)",
      },
 
      topRow: {
        display: "flex",
        alignItems: "flex-start",
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
 
      datePill: {
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
 
      desc: {
        margin: 0,
        fontSize: 14,
        color: "#374151",
        lineHeight: 1.75,
      },
 
      readMore: {
        marginTop: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: 0,
        background: "transparent",
        color: "#6f1d8f",
        fontWeight: 900,
        cursor: "pointer",
        padding: 0,
        fontSize: 13,
      },
    }),
    []
  );
 
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        {/* Purple Theme Header */}
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
 
          <h2 style={styles.title}>Our Blog</h2>
          <p style={styles.subtitle}>
            Insights, tips, and knowledge to support modern agriculture.
          </p>
        </div>
 
        {/* Cards */}
        <div style={styles.grid}>
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} styles={styles} />
          ))}
        </div>
      </div>
    </div>
  );
}
 
function BlogCard({ post, styles }) {
  const [hover, setHover] = React.useState(false);
 
  return (
    <div
      style={{ ...styles.card, ...(hover ? styles.cardHover : null) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={styles.topRow}>
        <h3 style={styles.cardTitle}>{post.title}</h3>
        <span style={styles.datePill}>{post.date}</span>
      </div>
 
      <p style={styles.desc}>{post.description}</p>
 
      <button
        type="button"
        style={styles.readMore}
        onClick={() => alert(`Open blog: ${post.title}`)}
      >
      </button>
    </div>
  );
}
 
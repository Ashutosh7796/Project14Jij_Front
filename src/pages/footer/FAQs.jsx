import React, { useMemo, useState, useLayoutEffect } from "react";
 
const faqsData = [
  {
    question: "How do I place an order?",
    answer:
      "You can place an order by selecting the product, adding it to your cart, and completing the checkout process.",
  },
  {
    question: "Do you deliver across India?",
    answer:
      "Yes, we deliver to most locations across India. Delivery availability may vary by region.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery in selected areas.",
  },
  {
    question: "Can I cancel or modify my order?",
    answer:
      "Orders can be modified or canceled before dispatch. Please contact support as soon as possible.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach us through the Contact Us page or email us at support@jiojigreenindia.com.",
  },
];
 
export default function FAQs() {
  const [activeIndex, setActiveIndex] = useState(null);
 
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
      colors: {
        purple1: "#6f1d8f",
        purple2: "#8f3aa7",
        purpleSoft: "rgba(111, 29, 143, 0.08)",
        bg: "#f6f7fb",
        card: "#ffffff",
        text: "#111827",
        muted: "#6b7280",
        border: "#e5e7eb",
      },
 
      page: {
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "28px 16px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      },
 
      wrap: {
        maxWidth: "980px",
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
 
      sub: {
        margin: "6px 0 0",
        opacity: 0.92,
        fontSize: 13,
        lineHeight: 1.6,
        maxWidth: 780,
      },
 
      box: {
        marginTop: 16,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 30px rgba(17,24,39,0.08)",
        overflow: "hidden",
      },
 
      item: {
        borderBottom: "1px solid #e5e7eb",
      },
 
      questionRow: (isOpen) => ({
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        cursor: "pointer",
        background: isOpen ? "rgba(111, 29, 143, 0.06)" : "#fff",
        border: 0,
        textAlign: "left",
      }),
 
      questionText: {
        color: "#111827",
        fontWeight: 900,
        fontSize: 15,
        lineHeight: 1.4,
      },
 
      pill: {
        minWidth: 34,
        height: 34,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        background: "rgba(111, 29, 143, 0.10)",
        border: "1px solid rgba(111, 29, 143, 0.16)",
        color: "#6f1d8f",
        fontWeight: 900,
        fontSize: 18,
        flexShrink: 0,
      },
 
      answerWrap: {
        padding: "0 16px 14px",
      },
 
      answer: {
        marginTop: 6,
        color: "#374151",
        fontSize: 14,
        lineHeight: 1.75,
      },
 
      footerNote: {
        marginTop: 12,
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 1.6,
      },
 
      link: {
        color: "#6f1d8f",
        fontWeight: 900,
        textDecoration: "none",
      },
    }),
    []
  );
 
  const toggleFAQ = (index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };
 
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        {/* Header - matches purple theme */}
        <div style={styles.header}>
          {/* ✅ Back Button Row */}
          <div style={styles.headerTopRow}>
            <button
              type="button"
              style={styles.backBtn}
              onClick={() => window.history.back()}
            >
               Back
            </button>
          </div>
 
          <h2 style={styles.title}>Frequently Asked Questions</h2>
          <p style={styles.sub}>
            Quick answers to common questions about ordering, delivery, and support.
          </p>
        </div>
 
        {/* Accordion */}
        <div style={styles.box}>
          {faqsData.map((faq, index) => {
            const isOpen = activeIndex === index;
 
            return (
              <div key={index} style={styles.item}>
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  style={styles.questionRow(isOpen)}
                  aria-expanded={isOpen}
                >
                  <span style={styles.questionText}>{faq.question}</span>
                  <span style={styles.pill}>{isOpen ? "−" : "+"}</span>
                </button>
 
                {isOpen ? (
                  <div style={styles.answerWrap}>
                    <div style={styles.answer}>{faq.answer}</div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
 
        <div style={styles.footerNote}>
          Still need help? Visit{" "}
          <a style={styles.link} href="/contact">
            Contact Us
          </a>{" "}
          or email{" "}
          <a style={styles.link} href="mailto:support@jiojigreenindia.com">
            support@jiojigreenindia.com
          </a>
          .
        </div>
      </div>
    </div>
  );
}
 
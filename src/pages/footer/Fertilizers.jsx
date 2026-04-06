import React, { useMemo, useState, useLayoutEffect } from "react";

import Wheat_Fertilizer from "../../assets/fertilizers_images/Wheat_Fertilizers.jpeg";
import Tomato_Fertilizer from "../../assets/fertilizers_images/Tomato_Fertilizers.jpeg";
import Onion_Fertilizer from "../../assets/fertilizers_images/Onion_Fertilizers.jpeg";
import Tinda_Fertilizer from "../../assets/fertilizers_images/Tinda_Fertilizers.jpeg";
import Soyabean_Fertilizer from "../../assets/fertilizers_images/Soyabean_Fertilizers.jpeg";
import Palak_Fertilizer from "../../assets/fertilizers_images/Palak_Fertilizers.jpeg";
import Radish_Fertilizer from "../../assets/fertilizers_images/Radish_Fertilizers.jpeg";
import Ridge_Fertilizer from "../../assets/fertilizers_images/Ridge_Fertilizers.jpeg";
import Spong_Fertilizer from "../../assets/fertilizers_images/Spong_fertilizers.jpeg";
import Cluster_Bean_Fertilizer from "../../assets/fertilizers_images/Cluster_Bean_Fertilizers.jpeg";
import Cowpea_Fertilizer from "../../assets/fertilizers_images/Cowpea_Fertilizers.jpeg";
import Brinjal_Fertilizer from "../../assets/fertilizers_images/Brinjal_Fertilizers.jpeg";
import Dollichos_Fertilizer from "../../assets/fertilizers_images/Dollichos_Fertilizers.jpeg";
import Chilli_Fertilizer from "../../assets/fertilizers_images/Chilli_Fertilizers.jpeg";
import Methi_Fertilizer from "../../assets/fertilizers_images/Methi_fertilizers.jpeg";
import Suryabindu_Fertilizer from "../../assets/fertilizers_images/Suryabindu_Fertilizers.jpeg";
import Subhraking_Fertilizer from "../../assets/fertilizers_images/SubhraKing_Fertilizers.jpeg";
import Chandra_Fertilizer from "../../assets/fertilizers_images/Chandra_Fertilizers.jpeg";
import Bottleguard_Fertilizer from "../../assets/fertilizers_images/BottleGuard_Fertilizers.jpeg";
import Cucumber_Fertilizer from "../../assets/fertilizers_images/Cucumber_Fertilizers.jpeg";

const fertilizersData = [
  {
    id: 1,
    name: "Wheat Fertilizers",
     image: Wheat_Fertilizer,
    description:
      "Wheat fertilizers are nutrient formulations designed to support optimal growth, tillering, and grain development in wheat crops.",
  },
  {
    id: 2,
    name: "Soyabean Fertilizers",
    image: Soyabean_Fertilizer,
    description:
      "Soyabean are rich in Phosphorus and Potassium, along with micronutrients like Zinc and Sulfur to improve seed quality and yield.",
  },
  {
    id: 3,
    name: "Tomato Fertilizers",
    image: Tomato_Fertilizer,
    description:
      "Tomato Fertilizers provide balanced Nitrogen, Phosphorus, and higher Potassium to enhance fruit size, color, taste, and overall yield.",
  },
  {
    id: 4,
    name: "Ridge Fertilizers",
    image: Ridge_Fertilizer,
    description:
      "Ridge fertilizers Ridge fertilizers are nutrient formulations applied along crop ridges to enhance root development and nutrient absorption efficiency.",
  },
  {
    id: 5,
    name: "Spong Fertilizers",
    image: Spong_Fertilizer,
    description:
      "Spong fertilizers are specialized nutrient formulations designed to enhance soil moisture retention and improve nutrient uptake efficiency.",
  },
  {
    id: 6,
    name: "Chilli Fertilizers",
    image: Chilli_Fertilizer,
    description:
      "Chilli fertilizers are formulated to promote healthy vegetative growth, abundant flowering, and high-quality fruit development in chilli crops.",
  },
  {
    id: 7,
    name: "Methi Fertilizers",
    image: Methi_Fertilizer,
    description:
      "Methi fertilizers are designed to support rapid leafy growth and strong root development in fenugreek crops.",
  },
  {
    id: 8,
    name: "Radish Fertilizers",
    image: Radish_Fertilizer,
    description:
      "Radish Fertilizers provide balanced Nitrogen and Phosphorus with adequate Potassium to improve root size, texture, and overall yield quality.",
  },
  {
      id: 9,
      name: "Tinda Fertilizers",
      image: Tinda_Fertilizer,
      description:
        "Tinda Fertilizers provide balanced Nitrogen, Phosphorus, and higher Potassium to enhance fruit size, tenderness, and overall yield.",
    },
{
    id: 10,
    name: "Coriander Fertilizers",
    image: Cluster_Bean_Fertilizer,
    description:
      "Coriander fertilizers are designed to promote healthy leafy growth and strong root establishment in coriander crops.",
  },
  {
      id: 11,
      name: "Carrot Fertilizers",
      image: Cluster_Bean_Fertilizer,
      description:
        "Carrot Fertilizers provide balanced Nitrogen and higher Potassium with adequate Phosphorus to improve root size, sweetness, and overall yield quality.",
    },
{
    id: 12,
    name: "Mustard Fertilizers",
    image: Cluster_Bean_Fertilizer,
    description:
      "Mustard fertilizers are designed to enhance vigorous vegetative growth, flowering, and oilseed formation in mustard crops.",
  },
  {
      id: 13,
      name: "Palak Fertilizers",
      image: Cluster_Bean_Fertilizer,
      description:
        "Palak fertilizers are formulated to promote rapid leafy growth and rich green foliage in spinach crops.",
    },
{
    id: 14,
    name: "Dollichos Fertilizers",
    image: Dollichos_Fertilizer,
    description:
      "Dolichos fertilizers are designed to support healthy vine growth, flowering, and pod development in dolichos (hyacinth bean) crops.",
  },
  {
      id: 15,
      name: "Brinjal Fertilizers",
      image: Brinjal_Fertilizer,
      description:
        "Brinjal fertilizers are formulated to promote strong vegetative growth, continuous flowering, and healthy fruit development in brinjal crops.",
    },
{
    id: 16,
    name: "Bhendi Fertilizers",
    image: Cluster_Bean_Fertilizer,
    description:
      "Bhendi fertilizers are formulated to support vigorous plant growth, early flowering, and continuous pod production in okra crops.",
  },
  {
      id: 17,
      name: "Onion Fertilizers",
      image: Onion_Fertilizer,
      description:
        "Onion fertilizers are designed to promote strong root establishment and uniform bulb development in onion crops.",
    },
{
    id: 18,
    name: "Cowpea Fertilizers",
    image: Cowpea_Fertilizer,
    description:
      "Cowpea fertilizers are formulated to support healthy root nodulation, vegetative growth, and abundant pod formation in cowpea crops.",
  },
  {
      id: 19,
      name: "Cluster_Bean Fertilizers",
      image: Cluster_Bean_Fertilizer,
      description:
        "Cluster bean fertilizers are designed to promote strong root development, effective nitrogen fixation, and healthy pod formation in guar crops.",
    },
{
      id: 20,
      name: "Cucumber Fertilizers",
      image: Cucumber_Fertilizer,
      description:
        "Cucumber Fertilizers provide balanced Nitrogen, adequate Phosphorus, and higher Potassium to enhance fruit size, color, and overall yield quality.",
    },
{
      id: 21,
      name: "Bottleguard Fertilizers",
      image: Bottleguard_Fertilizer,
      description:
        "Bottle gourd fertilizers are designed to promote healthy vine growth, abundant flowering, and uniform fruit development.",
    },
{
      id: 22,
      name: "F-1 Chandra Fertilizers",
      image: Chandra_Fertilizer,
      description:
        "F-1 Chandra fertilizers are specially formulated to support high-yield hybrid crop performance with balanced nutrient management.",
    },
{
      id: 23,
      name: "SubraKing Fertilizers",
      image: Subhraking_Fertilizer,
      description:
        "SubraKing fertilizers are premium nutrient formulations designed to promote vigorous crop growth and high yield performance.",
    },
{
      id: 24,
      name: "Suryabindu Fertilizers",
      image: Suryabindu_Fertilizer,
      description:
        "Suryabindu fertilizers are advanced nutrient formulations designed to ensure balanced crop growth and improved yield potential.",
    },
];
 
export default function Fertilizers() {
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
 
    const scrollToTopEverywhere = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

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

    scrollToTopEverywhere();

    requestAnimationFrame(() => {
      scrollToTopEverywhere();
    });

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

        cardImage: {
          width: "100%",
          height: 160,
          objectFit: "cover",
          borderRadius: 12,
          marginBottom: 12,
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
 
          <h2 style={styles.title}>Fertilizers</h2>
          <p style={styles.subtitle}>
            Explore our range of fertilizers designed to improve soil fertility
            and crop productivity.
          </p>
        </div>
 
        {/* Cards */}
        <div style={styles.grid}>
          {fertilizersData.map((item) => (
            <FertilizerCard key={item.id} item={item} styles={styles} />
          ))}
        </div>
      </div>
    </div>
  );
}
 
function FertilizerCard({ item, styles }) {
  const [hover, setHover] = useState(false);
 
  return (
    <div
      style={{ ...styles.card, ...(hover ? styles.cardHover : null) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img src={item.image} alt={item.name} style={styles.cardImage} />

      <div style={styles.cardTop}>
        <h3 style={styles.cardTitle}>{item.name}</h3>
        <span style={styles.badge}>Recommended</span>
      </div>
 
      <p style={styles.description}>{item.description}</p>
    </div>
  );
}
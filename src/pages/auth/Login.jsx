import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import jioji from "../../assets/Jioji_logo.png";
import AnimatedMeshGradient from "../../components/AnimatedMeshGradient";

import sweetCorn1 from "../../assets/products_images/sweetcorn1.jpeg";
import apple from "../../assets/products_images/apple.jpeg";
import wheat from "../../assets/products_images/wheat.jpeg";
import watermelon from "../../assets/products_images/watermelon.jpeg";
import orange from "../../assets/products_images/orange.jpeg";
import sunflower from "../../assets/products_images/sunflower.jpeg";
import bittermelon from "../../assets/products_images/bittermelon.jpeg";
import carrot from "../../assets/products_images/carrot.jpeg";

import { FaInstagramSquare } from "react-icons/fa";
import { BsYoutube, BsTwitterX } from "react-icons/bs";
import { ImFacebook2 } from "react-icons/im";
import { IoCallSharp } from "react-icons/io5";
import { MdAttachEmail } from "react-icons/md";
import { FaLocationDot } from "react-icons/fa6";
import { GrLogin } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── role → dashboard path (must match App.jsx routes) ── */
function getDashboardPath(role = "") {
  const r = String(role).toUpperCase().replace(/^ROLE_/, "");
  if (r === "ADMIN")                         return "/admin/dashboard";
  if (r === "EMPLOYEE" || r === "SURVEYOR")  return "/employee/dashboard";
  if (r === "LAB" || r === "LAB_TECHNICIAN") return "/lab/dashboard";
  if (r === "USER")                          return "/dashboard";
  return "/";
}

const categories = [
  { icon: "🌱", title: "Seeds", sub: "200+ Products" },
  {
    icon: "🧪",
    title: "Fertilizers",
    sub: "200+ Products",
    children: [
      { title: "Organic Fertilizers" },
      { title: "Bio Fertilizers" },
      { title: "Micronutrients" },
    ],
  },
  { icon: "🛠️", title: "Tools", sub: "150+ Products" },
  { icon: "🍃", title: "Organics", sub: "100+ Products" },
  { icon: "🪴", title: "Kitchen Garden", sub: "200+ Products" },
  { icon: "🌿", title: "Vegetable Nursery", sub: "150+ Products" },
  { icon: "📦", title: "Storage", sub: "80+ Products" },
];

const products = [
  {
    tag: "Best Seller",
    title: "Sweet Corn Seeds",
    category: "Seeds",
    rating: "4.8",
    reviews: "186",
    stock: "In Stock",
    //price: "₹299",
    //oldPrice: "₹399",
    images: [sweetCorn1],
  },
  {
    tag: "Fresh Produce",
    title: "Apple",
    category: "Fruits",
    rating: "4.7",
    reviews: "210",
    stock: "In Stock",
//     price: "₹180",
//     oldPrice: "₹220",
    images: [apple],
  },
  {
    tag: "Best Seller",
    title: "Wheat Seeds",
    category: "Seeds",
    rating: "4.6",
    reviews: "154",
    stock: "In Stock",
//     price: "₹249",
//     oldPrice: "₹320",
    images: [wheat],
  },
  {
    tag: "Seasonal",
    title: "Watermelon",
    category: "Fruits",
    rating: "4.5",
    reviews: "198",
    stock: "In Stock",
//     price: "₹120",
//     oldPrice: "₹160",
    images: [watermelon],
  },
  {
    tag: "Fresh Produce",
    title: "Orange",
    category: "Fruits",
    rating: "4.4",
    reviews: "176",
    stock: "In Stock",
//     price: "₹150",
//     oldPrice: "₹190",
    images: [orange],
  },
  {
    tag: "Popular",
    title: "Sunflower Seeds",
    category: "Seeds",
    rating: "4.8",
    reviews: "230",
    stock: "In Stock",
//     price: "₹199",
//     oldPrice: "₹260",
    images: [sunflower],
  },
  {
    tag: "Organic",
    title: "Bitter Melon Seeds",
    category: "Seeds",
    rating: "4.3",
    reviews: "142",
    stock: "In Stock",
//     price: "₹179",
//     oldPrice: "₹230",
    images: [bittermelon],
  },
  {
    tag: "Organic",
    title: "Carrot Seeds",
    category: "Seeds",
    rating: "4.6",
    reviews: "165",
    stock: "In Stock",
//     price: "₹159",
//     oldPrice: "₹210",
    images: [carrot],
  },
];

const trustCards = [
  {
    icon: "🛡️",
    title: "Quality Tested",
    desc: "Every product is lab-tested and certified for quality assurance",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Free shipping on orders above ₹999. Delivery across all states",
  },
  { icon: "↩️", title: "Easy Returns", desc: "7-day hassle-free return policy on all products" },
  { icon: "🎧", title: "Expert Support", desc: "Agricultural experts available to guide your purchases" },
  { icon: "🏅", title: "Certified Products", desc: "All seeds and fertilizers are government-certified" },
  { icon: "🍀", title: "Organic Options", desc: "Wide range of 100% organic and eco-friendly products" },
];

const stats = [
  { big: "5,000+", small: "Happy Farmers" },
  { big: "100+", small: "Products" },
  { big: "50+", small: "Districts Served" },
];

const footerLinks = {
  Shop: [
    { label: "Seeds", path: "/seeds" },
    { label: "Fertilizers", path: "/fertilizers" },
  ],
  Company: [
    { label: "About Us", path: "/about" },
    { label: "Blog", path: "/blog" },
  ],
  Support: [
    { label: "Contact Us", path: "/contact" },
    { label: "FAQs", path: "/faqs" },
  ],
};

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ userId: false, password: false });

  const categoryRef = useRef(null);
  const userIdRef = useRef(null);
  const [openCategory, setOpenCategory] = useState(null);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loginOkMsg, setLoginOkMsg] = useState("");

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (categoryRef.current && !categoryRef.current.contains(e.target)) {
      setOpenCategory(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen) setTimeout(() => userIdRef.current?.focus?.(), 0);
  }, [modalOpen]);

  const closeModal = () => setModalOpen(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ userId: true, password: true });
    setApiError("");
    setLoginOkMsg("");

    if (!userId.trim() || !password.trim()) return;

    try {
      setLoading(true);

      // Delegate to AuthContext.login() — this sets the token in
      // localStorage, updates React state, and only resolves AFTER
      // the state flush so navigate() fires with isAuthenticated=true.
      const response = await authLogin(
        { email: userId.trim(), password },
        "user",
      );

      const role = response?.roles?.[0] ?? localStorage.getItem("role") ?? "";
      const targetPath = getDashboardPath(role);

      setLoginOkMsg("Login successful!");
      setModalOpen(false);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setApiError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const userIdErr = touched.userId && !userId.trim();
  const passErr = touched.password && !password.trim();

  return (
    <div className="page homepage-redesign">
      {/* HERO */}
      <section className="hero">
        <AnimatedMeshGradient />
        
        <header className="heroNav container animate-fade-top">
          <div className="heroLogo glass-logo">
            <img className="logoImg" src={jioji} alt="Jioji Green India" />
          </div>

          <div className="loginWrap heroNavActions">
            <button className="heroNavGhost hover-lift" type="button" onClick={() => navigate("/register")}>
              Create account
            </button>
            <button className="loginBtn glow-btn hover-lift" type="button" onClick={() => navigate("/auth-login")}>
              <GrLogin /> Login
            </button>
          </div>
        </header>

        <div className="container heroInner">

          <div className="heroContentWrapper animate-fade-up">
            {apiError ? (
              <div className="fieldErr heroNotice" style={{ textAlign: "center" }}>
                {apiError}
              </div>
            ) : null}

            {loginOkMsg ? (
              <div className="pill heroNotice" style={{ marginTop: 10 }}>
                {loginOkMsg}
              </div>
            ) : null}

            <div className="pill trust-pill glowing-border">
              <span className="star-icon">⭐</span> Trusted by 5,000+ Farmers Across India
            </div>

            <h1 className="heroTitle text-gradient-bold">Certified Quality Seeds for Every Season</h1>

            <p className="heroSub">
              Premium farm products directly from certified suppliers. Quality tested seeds, fertilizers, and tools
              delivered to your doorstep
            </p>

            <div className="heroCtas">
              <button type="button" className="hero-btn-primary hover-lift" onClick={() => scrollToSection("shop-featured")}>
                Shop now
              </button>
              <button type="button" className="hero-btn-secondary hover-lift" onClick={() => scrollToSection("shop-categories")}>
                Browse categories
              </button>
            </div>
          </div>

          <div className="heroBadges animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="badge glass-badge hover-lift" style={{ animationDelay: "0.1s" }}>
              <div className="badgeIcon">✓</div>
              <div className="badgeTxt">
                <div className="badgeTitle">Quality Tested</div>
                <div className="badgeSub">Lab Certified Products</div>
              </div>
            </div>

            <div className="badge glass-badge hover-lift" style={{ animationDelay: "0.2s" }}>
              <div className="badgeIcon">🚚</div>
              <div className="badgeTxt">
                <div className="badgeTitle">Fast Delivery</div>
                <div className="badgeSub">Across All States</div>
              </div>
            </div>

            <div className="badge glass-badge hover-lift" style={{ animationDelay: "0.3s" }}>
              <div className="badgeIcon">👨‍🌾</div>
              <div className="badgeTxt">
                <div className="badgeTitle">Farmer Trusted</div>
                <div className="badgeSub">4.8+ Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {modalOpen ? (
        <div className="modalOverlay" onMouseDown={closeModal}>
          <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="modalTitle">Login</div>
              <button className="modalClose" type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="modalForm" onSubmit={onSubmit}>
              <label className="field">
                <div className="fieldLabel">Username</div>
                <input
                  ref={userIdRef}
                  className={`fieldInput ${userIdErr ? "fieldInputErr" : ""}`}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, userId: true }))}
                  placeholder="Enter Username"
                />
                {userIdErr ? <div className="fieldErr">Username is required</div> : null}
              </label>

              <label className="field">
                <div className="fieldLabel">Password</div>
                <input
                  className={`fieldInput ${passErr ? "fieldInputErr" : ""}`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="Enter password"
                />
                {passErr ? <div className="fieldErr">Password is required</div> : null}
              </label>

              <button className="modalSubmit" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* FULL-WIDTH CONTENT */}
      <section className="contentFull contentFull--elevated">
        <div className="container">
          <div className="sectionHead center" id="shop-categories">
            <span className="sectionKicker sectionKicker--dark">Categories</span>
            <h2 className="h2 h2--display">Shop by category</h2>
            <p className="muted">Everything you need for your farm in one place</p>
          </div>

          <div className="catGrid" ref={categoryRef}>
            {categories.map((c, idx) => (
              <button
                key={c.title}
                className="catCard animate-scale-up hover-lift"
                type="button"
                style={{ position: "relative", animationDelay: `${idx * 0.05}s` }}
                onClick={() =>
                  c.children
                    ? setOpenCategory(openCategory === c.title ? null : c.title)
                    : scrollToSection("shop-featured")
                }
              >
                <div className="catIcon">{c.icon}</div>
                <div className="catTitle">{c.title}</div>
                <div className="catSub">{c.sub}</div>

                {/* Dropdown only for Fertilizers */}
                {c.children && openCategory === c.title && (
                  <div className="catDropdown">
                    {c.children.map((sub) => (
                      <div
                        key={sub.title}
                        className="catDropdownItem"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCategory(null);
                        }}
                      >
                        {sub.title}
                      </div>
                    ))}
                  </div>
                )}

              </button>
            ))}
          </div>

          <div className="sectionRow">
            <div>
              <span className="sectionKicker sectionKicker--dark">Featured</span>
              <h3 className="h3 h3--lg">Top picks for your farm</h3>
              <p className="muted small">Highly rated products from fellow farmers</p>
            </div>
            <button type="button" className="link linkBtn" onClick={() => scrollToSection("shop-categories")}>
              Browse categories
            </button>
          </div>

          <div className="prodGrid" id="shop-featured">
            {products.map((p, idx) => (
              <div key={`${p.title}-${idx}`} className="prodCard animate-fade-up hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="prodImgWrap">
                  {p.tag ? <div className="tag glowing">{p.tag}</div> : null}
                  <img className="prodImg" src={p.images[0]} alt={p.title} />
                </div>

                <div className="prodBody">
                  <div className="prodCat">{p.category}</div>
                  <div className="prodTitle">{p.title}</div>

                  <div className="metaRow">
                    <span className="rating">★ {p.rating}</span>
                    <span className="reviews">({p.reviews})</span>
                  </div>

                  <div className="stock">✓ {p.stock}</div>

                  <div className="priceRow">
                    <div className="price">{p.price}</div>
                    <div className="oldPrice">{p.oldPrice}</div>
                  </div>

                  <button className="addBtn" type="button">
                    <span className="cart">
                      <FaShoppingCart />
                    </span>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          <section className="trust">
            <div className="sectionHead center animate-fade-up">
              <div className="miniPill glow-pill">Why Farmers Trust Us</div>
              <h2 className="h2 bigTitle text-gradient">Quality You Can Rely On</h2>
              <p className="muted trustSub">
                We're committed to providing the best farm products with guaranteed quality, fast delivery, and
                exceptional customer service.
              </p>
            </div>

            <div className="trustGrid">
              {trustCards.map((t) => (
                <div key={t.title} className="trustCard animate-scale-up hover-lift">
                  <div className="trustIcon">{t.icon}</div>
                  <div className="trustTitle">{t.title}</div>
                  <div className="trustDesc">{t.desc}</div>
                </div>
              ))}
            </div>

            <div className="statsBar">
              {stats.map((s) => (
                <div key={s.small} className="stat">
                  <div className="statBig">{s.big}</div>
                  <div className="statSmall">{s.small}</div>
                </div>
              ))}
            </div>
          </section>

          <footer className="footer">
            <div className="footGrid">
              <div className="brandCol">
                <div className="brand">
                  <span className="brandMark">
                    <img
                      src={jioji}
                      alt="Jioji"
                      className="brandLogo"
                    />
                  </span>
                  <span className="brandName">Jioji Green India</span>
                </div>

                <p className="brandDesc">
                  Your trusted partner for quality farm products. We deliver certified seeds, fertilizers, and tools
                  to farmers across India.
                </p>

                <div className="contact">
                  <div className="contactItem">
                    <IoCallSharp />
                    <a href="tel:+919766722922"className="contactLink">
                      +91 91753 12722
                    </a>
                  </div>
                  <div className="contactItem emailItem">
                    <MdAttachEmail /> <a href="mailto:sales@jiojigreenindia.com">sales@jiojigreenindia.com</a>
                  </div>
                  <div className="contactItem">
                    <FaLocationDot /> 431007 SainathVilla Sundrwadi Chatrapati Sambjinagar (Aurangabad) Near Cambridge School, 5star
                    MIDC, Airport Road Maharastra.
                  </div>
                </div>

                <div className="social">
                  <a className="socBtn" href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                    <ImFacebook2 />
                  </a>
                  <a className="socBtn" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <BsTwitterX />
                  </a>
                  <a className="socBtn" href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                    <FaInstagramSquare />
                  </a>
                  <a className="socBtn" href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                    <BsYoutube />
                  </a>
                </div>
              </div>

              {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title} className="linkCol">
                  <div className="colTitle">{title}</div>
                  <div className="colLinks">
                    {links.map((item) => (
                      <Link key={item.path} to={item.path} className="footLink">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="footBottom">
              <div className="copy">© 2025 jiojigreenindia Private Limited All rights reserved.</div>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
 
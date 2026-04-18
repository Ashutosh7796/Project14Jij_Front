import { jsPDF } from "jspdf";

/** Built logo URL (Vite); used in PDF header instead of overlapping vector leaves */
const LOGO_SRC = new URL("../assets/Jioji_logo.png", import.meta.url).href;

function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("logo"));
    img.src = src;
  });
}

/* ── Brand palette (match reference) ── */
const COL = {
  teal: [19, 78, 74],
  mint: [134, 239, 172],
  pageBg: [248, 250, 252],
  card: [255, 255, 255],
  slate600: [71, 85, 105],
  slate200: [226, 232, 240],
  tableRow: [241, 245, 249],
  totalBoxFill: [241, 245, 249],
  black: [0, 0, 0],
};

function toRupees(value) {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "0.00";
  return amount.toFixed(2);
}

/** India — date only, no time */
function formatDateOnly(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const UNITS = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n) {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return (TENS[t] + (u ? ` ${UNITS[u]}` : "")).trim();
}

function rupeesToWords(amount) {
  let n = Math.floor(Number(amount) || 0);
  if (n === 0) return "Zero Rupees Only";
  const parts = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rem = n % 100;

  if (crore) parts.push(`${below100(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (hundred) {
    parts.push(`${UNITS[hundred]} Hundred${rem ? ` and ${below100(rem)}` : ""}`);
  } else if (rem) {
    parts.push(below100(rem));
  }
  return `${parts.join(" ").replace(/\s+/g, " ").trim()} Rupees Only`;
}

function isPaidStatus(status) {
  const s = String(status || "").toUpperCase();
  return ["PAID", "SUCCESS", "SUCCESSFUL", "COMPLETED", "CAPTURED", "DONE"].includes(s);
}

function drawLeafPair(doc, cx, cy, scale = 1) {
  doc.setFillColor(...COL.mint);
  doc.ellipse(cx - 2 * scale, cy, 7 * scale, 12 * scale, "F");
  doc.ellipse(cx + 8 * scale, cy, 7 * scale, 12 * scale, "F");
}

/** Large faint brand + logo behind invoice body (below header) */
function drawBrandWatermark(doc, cardX, cardY, cardW, cardH, headerH, logoDataUrl) {
  const cx = cardX + cardW / 2;
  const cy = cardY + headerH + (cardH - headerH) / 2;
  const paint = () => {
    if (logoDataUrl) {
      // Logo watermark - positioned lower and to the right to avoid overlap with header
      const wm = 120;
      doc.addImage(logoDataUrl, "PNG", cx - wm / 2 + 40, cy - wm / 2 + 60, wm, wm);
    }
    // Text watermark - positioned lower and more to the right
    doc.setTextColor(...COL.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("JIOJIGREENINDIA", cx + 60, cy + 70, { align: "center", angle: -26 });
  };
  try {
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    paint();
    doc.setGState(new doc.GState({ opacity: 1 }));
  } catch {
    doc.setTextColor(226, 232, 236);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text("JIOJIGREENINDIA", cx + 60, cy + 70, { align: "center", angle: -26 });
  }
}

/** Person icon — same visual height as ~10pt text line */
function drawUserIcon(doc, x, yBaseline) {
  doc.setFillColor(...COL.teal);
  doc.setDrawColor(...COL.teal);
  doc.setLineWidth(0.35);
  doc.circle(x + 2.8, yBaseline - 3.2, 1.8, "F");
  doc.roundedRect(x + 0.4, yBaseline - 0.8, 5.6, 4.2, 0.8, 0.8, "S");
}

/** Two-line meta column: bold label, then wrapped value (stays inside column width) */
function columnMetaBlock(doc, x, colW, label, value, yStart, lh) {
  let y = yStart;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COL.black);
  doc.text(label, x, y);
  y += lh;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const vlines = doc.splitTextToSize(String(value ?? "N/A"), colW);
  doc.text(vlines, x, y);
  y += Math.max(vlines.length, 1) * lh;
  return y;
}

/** One row, two columns — returns next y */
function drawMetaRowTwoCol(doc, inner, innerW, gap, lh, y0, leftLabel, leftVal, rightLabel, rightVal) {
  const colW = (innerW - gap) / 2;
  const xR = inner + colW + gap;
  const yL = columnMetaBlock(doc, inner, colW, leftLabel, leftVal, y0, lh);
  const yR = columnMetaBlock(doc, xR, colW, rightLabel, rightVal, y0, lh);
  return Math.max(yL, yR) + 8;
}

/** Globe — compact, strokes contained */
function drawGlobeIcon(doc, x, y) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.45);
  const cx = x + 3.5;
  const cy = y - 2;
  doc.circle(cx, cy, 3.2, "S");
  doc.line(cx, cy - 3.2, cx, cy + 3.2);
  doc.line(cx - 3.2, cy, cx + 3.2, cy);
}

/** Closed envelope — single-stroke outline (no overlapping primitives) */
function drawEnvelopeIcon(doc, x, y) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  const w = 11;
  const h = 7;
  const top = y - 5;
  const left = x;
  const midX = left + w / 2;
  const bot = top + h;
  doc.line(left, top, midX, top + h * 0.45);
  doc.line(midX, top + h * 0.45, left + w, top);
  doc.line(left, top, left, bot);
  doc.line(left + w, top, left + w, bot);
  doc.line(left, bot, left + w, bot);
}

function drawPhoneIcon(doc, x, y) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.45);
  doc.roundedRect(x, y - 5.5, 7.5, 10.5, 1.2, 1.2, "S");
  doc.line(x + 2.2, y + 3.2, x + 5.2, y + 3.2);
}

export async function downloadFarmerInvoicePdf(paymentLike) {
  if (!paymentLike) return;

  const invoiceNo = `INV-${paymentLike.paymentId || "NA"}`;
  const orderId = String(paymentLike.ccavenueOrderId || paymentLike.orderId || "NA");
  const paymentIdStr = String(paymentLike.paymentId || "NA");
  const amountNum = Number(paymentLike.amount || 0);
  const amount = toRupees(amountNum);
  const paymentDateOnly = formatDateOnly(
    paymentLike.updatedAt || paymentLike.createdAt || paymentLike.paidAt
  );
  const farmerName = paymentLike.farmerName || "N/A";
  const surveyId = String(paymentLike.surveyId ?? "N/A");
  const paid = isPaidStatus(paymentLike.paymentStatus);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const pad = 28;
  const cardX = pad;
  const cardY = pad;
  const cardW = pageW - pad * 2;
  const cardH = pageH - pad * 2;
  const inner = cardX + 14;
  const innerW = cardW - 28;
  const colGap = 24;
  const lineH = 12.5;
  let y = cardY;

  doc.setFillColor(...COL.pageBg);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(...COL.card);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.85);
  doc.roundedRect(cardX, cardY, cardW, cardH, 14, 14, "FD");

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(LOGO_SRC);
  } catch {
    /* header will fall back to vector leaf */
  }

  const headerH = 102;
  drawBrandWatermark(doc, cardX, cardY, cardW, cardH, headerH, logoDataUrl);

  /* ── Header ── */
  doc.setFillColor(...COL.teal);
  doc.roundedRect(cardX, cardY, cardW, headerH, 14, 14, "F");
  doc.rect(cardX, cardY + headerH - 14, cardW, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const brandX = inner;
  const brandY = cardY + 42;
  const brandText = "JIOJIGREENINDIA";
  doc.text(brandText, brandX, brandY);
  const brandW = doc.getTextWidth(brandText);
  const logoGap = 10;
  const logoH = 30;
  const logoW = 30;
  const logoX = brandX + brandW + logoGap;
  const logoY = cardY + 18;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);
  } else {
    drawLeafPair(doc, logoX + logoW / 2, logoY + logoH / 2, 0.55);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(226, 232, 240);
  doc.text("Farmer Registration Payment Invoice", brandX, cardY + 62);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  const dateHeader = `Date: ${paymentDateOnly}`;
  const dateRx = cardX + cardW - 18;
  const dateTw = doc.getTextWidth(dateHeader);
  const dateX = dateRx - dateTw;
  doc.text(dateHeader, dateX, cardY + 40);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.line(dateX, cardY + 46, dateRx, cardY + 46);

  if (paid) {
    const stampW = 56;
    const stampH = 30;
    const marginR = 18;
    const sx = cardX + cardW - marginR - stampW;
    const sy = cardY + 58;
    doc.setDrawColor(...COL.mint);
    doc.setFillColor(209, 250, 229);
    doc.setLineWidth(1);
    doc.roundedRect(sx, sy, stampW, stampH, 4, 4, "FD");
    doc.setTextColor(...COL.teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("PAID", sx + 12, sy + 20, { angle: -12 });
  }

  y = cardY + headerH + 14;

  /* ── Meta: two columns × two rows (reference layout, no overlap) ── */
  y = drawMetaRowTwoCol(
    doc,
    inner,
    innerW,
    colGap,
    lineH,
    y,
    "Invoice No:",
    invoiceNo,
    "Date:",
    paymentDateOnly
  );
  y = drawMetaRowTwoCol(
    doc,
    inner,
    innerW,
    colGap,
    lineH,
    y,
    "Order ID:",
    orderId,
    "Payment ID:",
    paymentIdStr
  );

  /* ── Bill To ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const labFn = "Farmer Name:";
  const labSid = "Survey ID:";
  const lwFn = doc.getTextWidth(labFn);
  const lwSid = doc.getTextWidth(labSid);
  const labelColW = Math.max(lwFn, lwSid) + 6;

  const iconSlot = 13;
  const labelX = inner + 14 + iconSlot;
  const valueX = labelX + labelColW;
  const valueMaxW = inner + innerW - valueX - 14;

  const nameLines = doc.splitTextToSize(farmerName, valueMaxW);
  const surveyLines = doc.splitTextToSize(surveyId, valueMaxW);
  const billPadT = 14;
  const billPadB = 12;
  const row1Y = y + billPadT + 18;
  const row2Y = row1Y + Math.max(nameLines.length, 1) * lineH + 8;
  const billH = row2Y + Math.max(surveyLines.length, 1) * lineH + billPadB - y;

  doc.setDrawColor(...COL.mint);
  doc.setLineWidth(1.05);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(inner, y, innerW, billH, 10, 10, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COL.black);
  doc.text("Bill To", inner + 14, y + 16);

  drawUserIcon(doc, inner + 14, row1Y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(labFn, labelX, row1Y);
  doc.setFont("helvetica", "normal");
  doc.text(nameLines, valueX, row1Y);

  doc.setFont("helvetica", "bold");
  doc.text(labSid, labelX, row2Y);
  doc.setFont("helvetica", "normal");
  doc.text(surveyLines, valueX, row2Y);

  y += billH + 16;

  /* ── Table ── */
  const tableX = inner;
  const tableW = innerW;
  const rowH = 28;
  const col1 = tableX + 10;
  const col2 = tableX + innerW * 0.52;
  const col3 = tableX + innerW * 0.68;
  const col4 = tableX + innerW * 0.82;
  const tealStroke = () => {
    doc.setDrawColor(...COL.teal);
    doc.setLineWidth(0.55);
  };

  doc.setFillColor(...COL.teal);
  doc.rect(tableX, y, tableW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Particulars", col1, y + 19);
  doc.text("Qty", col2, y + 19);
  doc.text("Rate", col3, y + 19);
  doc.text("Amount", col4, y + 19);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(col2 - 6, y, col2 - 6, y + rowH);
  doc.line(col3 - 6, y, col3 - 6, y + rowH);
  doc.line(col4 - 6, y, col4 - 6, y + rowH);

  y += rowH;
  doc.setFillColor(...COL.tableRow);
  doc.rect(tableX, y, tableW, rowH, "F");
  tealStroke();
  doc.rect(tableX, y, tableW, rowH, "S");
  doc.setTextColor(...COL.black);
  doc.setFont("helvetica", "normal");
  doc.text("Farmer Registration Fee", col1, y + 19);
  doc.text("1", col2, y + 19);
  doc.text(`Rs. ${amount}`, col3, y + 19);
  doc.text(`Rs. ${amount}`, col4, y + 19);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.45);
  doc.line(col2 - 6, y, col2 - 6, y + rowH);
  doc.line(col3 - 6, y, col3 - 6, y + rowH);
  doc.line(col4 - 6, y, col4 - 6, y + rowH);

  y += rowH + 14;

  /* Amount in words — normal weight (reference); total box with mint border */
  const words = rupeesToWords(amountNum);
  const wordsFull = `Amount in Words: ${words}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COL.slate600);
  const wordsLines = doc.splitTextToSize(wordsFull, innerW - 8);
  doc.text(wordsLines, inner, y);
  y += wordsLines.length * lineH + 6;

  const totalBoxW = 178;
  const totalBoxH = 42;
  const totalBoxX = tableX + tableW - totalBoxW;
  doc.setFillColor(...COL.totalBoxFill);
  doc.setDrawColor(...COL.mint);
  doc.setLineWidth(1.15);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COL.black);
  doc.text(`Total: Rs. ${amount}`, totalBoxX + totalBoxW / 2, y + 27, { align: "center" });

  y += totalBoxH + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COL.teal);
  doc.text("Thank You for Registering!", inner, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COL.slate600);
  doc.text("Payment information", inner, y);
  y += 11;
  doc.setFontSize(9);
  const payLine = (lbl, val) => {
    doc.setFont("helvetica", "bold");
    doc.text(lbl, inner, y);
    const w = doc.getTextWidth(lbl);
    doc.setFont("helvetica", "normal");
    const rest = doc.splitTextToSize(String(val ?? "N/A"), innerW - w - 8);
    doc.text(rest, inner + w + 2, y);
    y += Math.max(rest.length, 1) * 11;
  };
  payLine("Status: ", paymentLike.paymentStatus || "N/A");
  payLine("Tracking ID: ", paymentLike.trackingId || "N/A");
  payLine("Bank Ref No: ", paymentLike.bankRefNo || "N/A");
  payLine("Payment Mode: ", paymentLike.ccavenuePaymentMode || "N/A");
  y += 6;

  const footH = 68;
  const footY = cardY + cardH - footH - 10;
  doc.setFillColor(...COL.black);
  doc.setDrawColor(...COL.black);
  doc.roundedRect(cardX, footY, cardW, footH, 10, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const footPadX = inner + 6;
  let fy = footY + 20;

  // First row: Website (left) and Email (right)
  drawGlobeIcon(doc, footPadX, fy);
  doc.text("www.jiojigreenindia.org", footPadX + 12, fy);

  drawEnvelopeIcon(doc, cardX + cardW / 2 + 20, fy);
  doc.text("sales@jiojigreenindia.com", cardX + cardW / 2 + 34, fy);

  // Second row: Phone (left) and Office (right)
  fy += 22;
  drawPhoneIcon(doc, footPadX, fy);
  doc.text("+91 91753 12722", footPadX + 12, fy);

  const office = "Office: Chatrapati Sambjinagar ";
  doc.text(office, cardX + cardW / 2 + 34, fy);

  doc.save(`${invoiceNo}.pdf`);
}

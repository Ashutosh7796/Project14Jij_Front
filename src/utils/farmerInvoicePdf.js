import { jsPDF } from "jspdf";

function toRupees(value) {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "0.00";
  return amount.toFixed(2);
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function downloadFarmerInvoicePdf(paymentLike) {
  if (!paymentLike) return;

  const invoiceNo = `INV-${paymentLike.paymentId || "NA"}`;
  const orderId = paymentLike.ccavenueOrderId || paymentLike.orderId || "NA";
  const amount = toRupees(paymentLike.amount);
  const paymentDate = formatDateTime(paymentLike.updatedAt || paymentLike.createdAt || paymentLike.paidAt);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 36;

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 88, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("JIOJIGREENINDIA", margin, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Farmer Registration Payment Invoice", margin, 62);

  y = 115;
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Invoice No:", margin, y);
  doc.text("Date:", pageWidth - 180, y);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceNo, margin + 68, y);
  doc.text(paymentDate, pageWidth - 145, y);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Order ID:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(orderId, margin + 68, y);

  y += 28;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 74, 8, 8);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", margin + 12, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.text(`Farmer Name: ${paymentLike.farmerName || "N/A"}`, margin + 12, y);
  y += 16;
  doc.text(`Survey ID: ${paymentLike.surveyId || "N/A"}`, margin + 12, y);
  y += 16;
  doc.text(`Payment ID: ${paymentLike.paymentId || "N/A"}`, margin + 12, y);

  y += 28;
  const tableX = margin;
  const tableW = pageWidth - margin * 2;
  const rowH = 26;
  const colXs = [tableX, tableX + 280, tableX + 360, tableX + 450, tableX + tableW];

  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y, tableW, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Particulars", colXs[0] + 8, y + 17);
  doc.text("Qty", colXs[1] + 8, y + 17);
  doc.text("Rate", colXs[2] + 8, y + 17);
  doc.text("Amount", colXs[3] + 8, y + 17);

  y += rowH;
  doc.setFont("helvetica", "normal");
  doc.rect(tableX, y, tableW, rowH);
  doc.text("Farmer Registration Fee", colXs[0] + 8, y + 17);
  doc.text("1", colXs[1] + 8, y + 17);
  doc.text(`Rs. ${amount}`, colXs[2] + 8, y + 17);
  doc.text(`Rs. ${amount}`, colXs[3] + 8, y + 17);

  colXs.slice(1, -1).forEach((x) => {
    doc.line(x, y - rowH, x, y + rowH);
  });

  y += rowH + 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: Rs. ${amount}`, pageWidth - margin - 140, y);

  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Payment Details", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.text(`Status: ${paymentLike.paymentStatus || "N/A"}`, margin, y);
  y += 14;
  doc.text(`Tracking ID: ${paymentLike.trackingId || "N/A"}`, margin, y);
  y += 14;
  doc.text(`Bank Ref No: ${paymentLike.bankRefNo || "N/A"}`, margin, y);
  y += 14;
  doc.text(`Payment Mode: ${paymentLike.ccavenuePaymentMode || "N/A"}`, margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 760, pageWidth - margin, 760);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("This is a system-generated invoice from JIOJIGREENINDIA.", margin, 778);

  doc.save(`${invoiceNo}.pdf`);
}


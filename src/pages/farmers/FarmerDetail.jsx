import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "../../hooks/useToast";
import { BASE_URL } from "../../config/api";
import "./FarmersDetails.css";

const getToken = () => localStorage.getItem("token");

const FarmerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ ref for PDF download
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/v1/employeeFarmerSurveys/${id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const json = await res.json();
        setData(json.data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

  // ✅ Download Whole Form as PDF
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    try {
      const element = pdfRef.current;

      // Capture full content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // multiple pages if content is large
      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Survey-${data?.formNumber || id || "Details"}.pdf`);
    } catch (error) {
      showToast("Failed to download PDF. Please try again.", "error");
    }
  };

  // ✅ Download base64 image properly
  const handleDownloadImage = () => {
    if (!data?.farmerSelfie?.imageUrl) return;

    try {
      const base64Data = data.farmerSelfie.imageUrl;

      const link = document.createElement("a");
      link.href = `data:image/jpeg;base64,${base64Data}`;
      link.download = `FarmerSelfie-${data?.farmerName || "Image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showToast("Failed to download image.", "error");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="detail-page-wrapper">
      {/* ✅ DOWNLOAD BUTTONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button
          className="grey-outline-btn"
          onClick={handleDownloadPDF}
          style={{ padding: "10px 16px" }}
        >
           Download Form (PDF)
        </button>
      </div>

      {/* ✅ WRAP FULL FORM IN REF */}
      <div ref={pdfRef}>
        {/* HEADER */}
        <div className="detail-header">
          <h3 className="title-main">Survey Details</h3>
          <div className="header-meta">
            <div className="info-item">
              <span>Form Number:</span>
              <span>{data?.formNumber || "N/A"}</span>
            </div>
            <div className="info-item">
              <span>Feedback ID:</span>
              <span>{data?.surveyId || "New"}</span>
            </div>
            <div className="info-item">
              <span>Status:</span>
              <span>{data?.formStatus || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* FARMER INFORMATION */}
        <div className="detail-section">
          <div className="grey-section-bar">Farmer Information</div>
          <div className="info-grid">
            <div className="info-item">
              <span>Name</span>
              <span>: {data?.farmerName || "N/A"}</span>
            </div>

            <div className="info-item">
              <span>User ID</span>
              <span>: {data?.userId || "N/A"}</span>
            </div>

            <div className="info-item">
              <span>Phone No</span>
              <span>: {data?.farmerMobile || "N/A"}</span>
            </div>

            <div className="info-item">
              <span>Taluka</span>
              <span>: {data?.taluka || "N/A"}</span>
            </div>

            <div className="info-item">
              <span>District</span>
              <span>: {data?.district || "N/A"}</span>
            </div>

            <div className="info-item full">
              <span>Address</span>
              <span>: {data?.address || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* SURVEY DETAILS */}
        <div className="detail-section">
          <div className="grey-section-bar">Survey Details</div>
          <div className="info-grid">
            <div className="info-item">
              <span>Survey Type</span>
              <span>: Survey</span>
            </div>
            <div className="info-item">
              <span>Submitted On</span>
              <span>
                :{" "}
                {data?.farmerSelfie?.takenAt
                  ? new Date(data.farmerSelfie.takenAt).toLocaleDateString(
                      "en-IN",
                      { day: "2-digit", month: "short", year: "numeric" }
                    )
                  : "N/A"}
              </span>
            </div>
          </div>

          {data?.farmInformation && (
            <div className="detail-message-box">
              <strong>Message:</strong>
              <p>"{data.farmInformation}"</p>
            </div>
          )}
        </div>

        {/* FARM DETAILS */}
        <div className="detail-section">
          <div className="grey-section-bar">Farm Details</div>
          <div className="info-grid">
            <div className="info-item">
              <span>Land Area</span>
              <span>: {data?.landArea || "N/A"}</span>
            </div>
            <div className="info-item">
              <span>Sample Collected</span>
              <span>: {data?.sampleCollected ? "Yes" : "No"}</span>
            </div>
            <div className="info-item full">
              <span>Crops</span>
              <span>: {data?.cropDetails?.join(", ") || "N/A"}</span>
            </div>
            <div className="info-item full">
              <span>Livestock</span>
              <span>: {data?.livestockDetails?.join(", ") || "N/A"}</span>
            </div>
            <div className="info-item full">
              <span>Equipment</span>
              <span>: {data?.productionEquipment?.join(", ") || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* ATTACHMENTS */}
        <div className="detail-section">
          <div className="grey-section-bar">Attachments (if any)</div>

          {data?.farmerSelfie?.imageUrl ? (
            <div className="attachment-group">
              <div className="preview-square">
                <div className="img-preview">
                  <img
                    src={`data:image/jpeg;base64,${data.farmerSelfie.imageUrl}`}
                    alt="Farmer Selfie"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
                <span className="file-label">Farmer.jpg</span>
              </div>

              <button
                className="grey-outline-btn"
                onClick={handleDownloadImage}
              >
                Download Image
              </button>
            </div>
          ) : (
            <p style={{ paddingLeft: "10px", color: "#888", fontSize: "14px" }}>
              No attachments available
            </p>
          )}
        </div>

        {/* SURVEY STATUS */}
        <div className="detail-section">
          <div className="grey-section-bar">Survey Status</div>
          <div className="payment-summary">
            <div>
              <span>Status</span>
              <span>: {data?.formStatus || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BACK BUTTON */}
      <div style={{ marginTop: "30px", paddingLeft: "10px" }}>
        <button
          className="grey-outline-btn"
          onClick={() => navigate("/admin/farmers")}
          style={{ padding: "10px 30px" }}
        >
          Back
        </button>
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

export default FarmerDetail;

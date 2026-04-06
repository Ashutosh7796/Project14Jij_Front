import React, { useState } from 'react';
import './UpdateFarmer.css';
import { useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';


const UpdateFarmer = () => {
  const { showToast, ToastComponent } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    farmerId: '',
    mobile: '',
    village: '',
    landArea: '',
    address: '',
    taluka: '',
    district: '',
    totalLandArea: '',
    cropType: '',
    cropSeason: '',
    irrigationType: '',
    fertilizerUsed: '',
    seedType: '',
    machineryUsed: '',
    reasonForUpdate: '',
    additionalNotes: ''
  });
  useEffect(() => {
  // 📱 MOBILE-ONLY: force page to open from top
  if (window.matchMedia("(max-width: 768px)").matches) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
 
    // extra safety for iOS Safari
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }
}, []);
useEffect(() => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Farmer data updated successfully!', 'success');
  };

  const handleCancel = () => {
  };

  return (
      <div className="update-farmer-page">
        <h1 className="page-title">Update Farmer Data</h1>
        
        <div className="farmer-header">
          <div className="farmer-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="farmer-info">
            <div className="farmer-name-section">
              <h2>{formData.name || 'Farmer Name'}</h2>
              <span className="active-badge">Active Farmer</span>
            </div>
            <div className="farmer-quick-info">
              <div className="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <div>
                  <span className="label">FARMER ID</span>
                  <span className="value">{formData.farmerId || 'Not Set'}</span>
                </div>
              </div>
              <div className="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div>
                  <span className="label">MOBILE</span>
                  <span className="value">{formData.mobile || 'Not Set'}</span>
                </div>
              </div>
              <div className="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <span className="label">VILLAGE</span>
                  <span className="value">{formData.village || 'Not Set'}</span>
                </div>
              </div>
              <div className="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <div>
                  <span className="label">LAND AREA</span>
                  <span className="value">{formData.landArea ? `${formData.landArea} Acres` : 'Not Set'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="update-farmer-form">
          <div className="form-sections">
            {/* Contact & Location Section */}
            <div className="form-section">
              <div className="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <h3>Contact & Location</h3>
                  <p>Update contact details and address</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>Mobile Number <span className="required">*</span></label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Village <span className="required">*</span></label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Taluka / District <span className="required">*</span></label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Land & Crop Details Section */}
            <div className="form-section">
              <div className="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <div>
                  <h3>Land & Crop Details</h3>
                  <p>Manage agricultural information</p>
                </div>
              </div>

              <div className="form-group">
                <label>Total Land Area (Acres) <span className="modified">✓ Modified</span></label>
                <input
                  type="text"
                  name="totalLandArea"
                  value={formData.totalLandArea}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Crop Type</label>
                <select name="cropType" value={formData.cropType} onChange={handleChange}>
                  <option value="">Select Crop Type</option>
                  <option>Cotton</option>
                  <option>Wheat</option>
                  <option>Rice</option>
                  <option>Sugarcane</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Crop Season</label>
                  <select name="cropSeason" value={formData.cropSeason} onChange={handleChange}>
                    <option value="">Select Season</option>
                    <option>Kharif (Monsoon)</option>
                    <option>Rabi (Winter)</option>
                    <option>Zaid (Summer)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Irrigation Type</label>
                  <select name="irrigationType" value={formData.irrigationType} onChange={handleChange}>
                    <option value="">Select Irrigation</option>
                    <option>Drip Irrigation</option>
                    <option>Sprinkler</option>
                    <option>Flood Irrigation</option>
                    <option>Rainfed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Farming Practices Section */}
            <div className="form-section">
              <div className="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <div>
                  <h3>Farming Practices</h3>
                  <p>Input materials and equipment</p>
                </div>
              </div>

              <div className="form-group">
                <label>Fertilizer Used</label>
                <input
                  type="text"
                  name="fertilizerUsed"
                  value={formData.fertilizerUsed}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Seed Type</label>
                <input
                  type="text"
                  name="seedType"
                  value={formData.seedType}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Machinery Used <span className="optional">(Optional)</span></label>
                <input
                  type="text"
                  name="machineryUsed"
                  value={formData.machineryUsed}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Notes & Changes Section */}
            <div className="form-section">
              <div className="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <div>
                  <h3>Notes & Changes</h3>
                  <p>Document updates and observations</p>
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Update <span className="optional">(Optional)</span></label>
                <input
                  type="text"
                  name="reasonForUpdate"
                  value={formData.reasonForUpdate}
                  onChange={handleChange}
                  placeholder="Enter reason for this update..."
                />
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes or observations about this farmer..."
                  rows="4"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Update Data
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
        
        {/* Toast Notifications */}
        <ToastComponent />
      </div>
  );
};

export default UpdateFarmer;
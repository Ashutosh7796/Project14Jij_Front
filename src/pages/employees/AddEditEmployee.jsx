import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Employee.css';
import { BASE_URL } from "/src/config/api.js";
import { getToken as getCentralToken, clearAuthData } from '../../utils/auth';

const getToken = getCentralToken;

/* ===== INLINE NOTIFICATION COMPONENT ===== */
const Notification = ({ notifications, onClose }) => {
  if (!notifications.length) return null;
  return (
    <div className="notif-container">
      {notifications.map((n) => (
        <div key={n.id} className={`notif-box notif-${n.type}`}>
          <span className="notif-icon">
            {n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="notif-msg">{n.message}</span>
          <button className="notif-close" onClick={() => onClose(n.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

const verifyTokenBeforeUpload = async (token) => {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/employees`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch { return false; }
};

const AddEditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fieldRefs = useRef({});

  /* ===== STATES ===== */
  const [showPreview, setShowPreview] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const [files, setFiles] = useState({ image: null, pan: null, aadhaar: null, passbook: null });

  const [formData, setFormData] = useState({
    email: '', mobileNumber: '', role: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', companyName: '', address: '', city: '',
    permanentAddress: '', altMobileNumber: '', district: '', state: '',
    pfNumber: '', insuranceNumber: '', accountNumber: '', ifscCode: '',
    panNumber: '', vehicleNumber: '', description: '',
    acceptTerms: false, acceptPrivacyPolicy: false
  });

  const [loading, setLoading] = useState(false);

  /* ===== NOTIFICATION HELPERS ===== */
  const showNotif = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const closeNotif = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /* ===== SCROLL TO FIELD ON ERROR ===== */
  const scrollToField = (name) => {
    const el = fieldRefs.current[name];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const setFieldError = (name, msg) => {
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
    scrollToField(name);
  };

  const clearFieldError = (name) => {
    setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  /* ===== LOAD EMPLOYEE ===== */
  useEffect(() => {
    if (!id) return;
    const loadEmployee = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${BASE_URL}/api/v1/admin/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.status === 401) { clearAuthData(); navigate('/auth-login'); return; }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to load employee');
        setFormData({ ...json.data, password: '', confirmPassword: '' });
        setCurrentUserId(
          json.data?.UserId ?? json.data?.userId ?? json.data?.userID ?? json.data?.UserID ?? json.data?.id
        );
        setIsRegistered(true);
      } catch (err) {
        showNotif(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [id, navigate, showNotif]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    clearFieldError(name);

    // Live 10-digit validation for mobile fields
    if (name === 'mobileNumber') {
      const digits = value.replace(/\D/g, '');
      if (value && digits.length !== 10) {
        setFieldErrors(prev => ({ ...prev, mobileNumber: 'Phone number must be exactly 10 digits' }));
      }
    }
    if (name === 'altMobileNumber' && value) {
      const digits = value.replace(/\D/g, '');
      if (digits.length !== 10) {
        setFieldErrors(prev => ({ ...prev, altMobileNumber: 'Emergency mobile number must be exactly 10 digits' }));
      }
    }

    // Live confirm password check
    if (name === 'confirmPassword' || name === 'password') {
      const pw = name === 'password' ? value : formData.password;
      const cpw = name === 'confirmPassword' ? value : formData.confirmPassword;
      if (cpw && pw !== cpw) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setFieldErrors(prev => { const next = { ...prev }; delete next.confirmPassword; return next; });
      }
    }
  };

  /* ===== VALIDATE REQUIRED FIELDS ===== */
  const validateRequired = (fields) => {
    for (const [name, label] of fields) {
      const val = formData[name];
      if (!val || (typeof val === 'string' && !val.trim())) {
        setFieldError(name, `${label} is required`);
        showNotif(`${label} is required`, 'error');
        return false;
      }
    }
    return true;
  };

  /* ===== REGISTER USER (Phase 1) ===== */
  const handleRegister = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const requiredFields = [
      ['firstName', 'First Name'], ['lastName', 'Last Name'], ['email', 'Email'],
      ['mobileNumber', 'Phone Number'], ['role', 'User Type'], ['address', 'Address'],
      ['permanentAddress', 'Permanent Address'], ['district', 'District'],
      ['state', 'State'], ['accountNumber', 'Account Number'], ['ifscCode', 'IFSC Code'],
      ['password', 'Password'], ['confirmPassword', 'Confirm Password'],
    ];
    if (!validateRequired(requiredFields)) return;

    // Mobile number: exactly 10 digits
    const mobileStr = String(formData.mobileNumber).replace(/\D/g, '');
    if (mobileStr.length !== 10) {
      setFieldError('mobileNumber', 'Phone number must be exactly 10 digits');
      showNotif('Phone number must be exactly 10 digits', 'error');
      return;
    }

    // Alternate mobile: 10 digits if provided
    if (formData.altMobileNumber) {
      const altStr = String(formData.altMobileNumber).replace(/\D/g, '');
      if (altStr.length !== 10) {
        setFieldError('altMobileNumber', 'Emergency mobile number must be exactly 10 digits');
        showNotif('Emergency mobile number must be exactly 10 digits', 'error');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      showNotif('Password and Confirm Password do not match', 'error');
      return;
    }

    if (formData.password.length < 8) {
      setFieldError('password', 'Password must be at least 8 characters');
      showNotif('Password must be at least 8 characters', 'error');
      return;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacyPolicy) {
      showNotif('Please accept Terms and Privacy Policy', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email, mobileNumber: parseInt(formData.mobileNumber),
        password: formData.password, confirmPassword: formData.confirmPassword,
        firstName: formData.firstName, lastName: formData.lastName, role: formData.role,
        companyName: formData.companyName || '', address: formData.address,
        permanentAddress: formData.permanentAddress, city: formData.city,
        district: formData.district, state: formData.state,
        accountNumber: formData.accountNumber, ifscCode: formData.ifscCode,
        panNumber: formData.panNumber || '', vehicleNumber: formData.vehicleNumber || '',
        description: formData.description || '',
        acceptTerms: formData.acceptTerms, acceptPrivacyPolicy: formData.acceptPrivacyPolicy
      };

      const res = await fetch(`${BASE_URL}/api/auth/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to register employee');

      // Try every possible casing the backend might return
      const userId =
        json.UserId ?? json.userId ?? json.userID ?? json.UserID ??
        json.data?.UserId ?? json.data?.userId ?? json.data?.userID ?? json.data?.UserID ??
        json.data?.id ?? json.id;

      if (!userId) throw new Error(`Registration succeeded but no User ID found in response. Response: ${JSON.stringify(json)}`);

      setCurrentUserId(String(userId));
      setIsRegistered(true);
      showNotif('Employee registered successfully! You can now upload documents or go back to the list.', 'success');

      // Reset form so the same email can't be accidentally re-submitted
      setFormData({
        email: '', mobileNumber: '', role: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', companyName: '', address: '', city: '',
        permanentAddress: '', altMobileNumber: '', district: '', state: '',
        pfNumber: '', insuranceNumber: '', accountNumber: '', ifscCode: '',
        panNumber: '', vehicleNumber: '', description: '',
        acceptTerms: false, acceptPrivacyPolicy: false
      });
      setFieldErrors({});
    } catch (err) {
      showNotif(err.message || 'Failed to register employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ===== FILE UPLOAD ===== */
  const handleFileUpload = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const documentTypeMap = { image: 'PROFILE_PHOTO', pan: 'PAN_CARD', aadhaar: 'AADHAAR_CARD', passbook: 'BANK_PASSBOOK' };
    const documentType = documentTypeMap[type];

    // Use id (edit mode) OR currentUserId (just registered)
    const targetUserId = id || currentUserId;

    if (!targetUserId) {
      showNotif('User ID not available. Please register the user first.', 'error');
      return;
    }

    const token = getToken();
    if (!token) {
      showNotif('Authentication token not found. Please login again.', 'error');
      navigate('/auth-login');
      return;
    }

    const isTokenValid = await verifyTokenBeforeUpload(token);
    if (!isTokenValid) {
      showNotif('Your session has expired. Please login again.', 'error');
      clearAuthData();
      navigate('/auth-login');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: { file, preview: URL.createObjectURL(file) } }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('UserId', String(targetUserId));   // backend expects capital U capital I
      uploadFormData.append('documentType', documentType);
      uploadFormData.append('description', formData.description || documentType);

      const res = await fetch(`${BASE_URL}/api/v1/documents/uploadByUser`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      if (res.status === 401) {
        const errorJson = await res.json().catch(() => ({}));
        showNotif(`Upload Failed: ${errorJson.message || 'Invalid or expired token'}. Please login again.`, 'error');
        clearAuthData();
        navigate('/auth-login');
        removeFile(type);
        return;
      }
      if (res.status === 403) {
        const errorJson = await res.json().catch(() => ({}));
        showNotif(`Access denied: ${errorJson.message || "You don't have permission to upload documents"}`, 'error');
        removeFile(type);
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Failed to upload ${documentType}`);

      showNotif(`${documentType.replace(/_/g, ' ')} uploaded successfully!`, 'success');
    } catch (err) {
      showNotif(`Failed to upload ${documentType || type}: ${err.message}`, 'error');
      removeFile(type);
    }
  };

  const removeFile = (type) => {
    setFiles(prev => {
      const current = prev[type];
      if (current?.preview) URL.revokeObjectURL(current.preview);
      return { ...prev, [type]: null };
    });
  };

  /* ===== FINAL SAVE ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add mode: registration already happened via "Register User" button, just go back
    if (!id) {
      if (!isRegistered) {
        showNotif('Please complete registration first by clicking "Register User".', 'error');
        return;
      }
      navigate('/admin/employees');
      return;
    }

    // Edit mode: update existing employee
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotif('Authentication token not found. Please login again.', 'error');
        navigate('/auth-login');
        return;
      }
      const payload = { ...formData, mobileNumber: parseInt(formData.mobileNumber) || formData.mobileNumber };
      const res = await fetch(`${BASE_URL}/api/v1/admin/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        showNotif('Session expired. Please login again.', 'error');
        clearAuthData();
        navigate('/auth-login');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save updates');
      showNotif('Employee updated successfully!', 'success');
      setTimeout(() => navigate('/admin/employees'), 1500);
    } catch (err) {
      showNotif(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fieldLabels = {
    firstName: 'First Name', lastName: 'Last Name', email: 'Email ID',
    mobileNumber: 'Phone Number', role: 'User Type', companyName: 'Company Name',
    address: 'Address', city: 'City', permanentAddress: 'Permanent Address',
    altMobileNumber: 'Alt Mobile Number', district: 'District', state: 'State',
    pfNumber: 'PF Number', insuranceNumber: 'Insurance Number', accountNumber: 'Account Number',
    ifscCode: 'IFSC Code', panNumber: 'PAN Number', vehicleNumber: 'Vehicle Number',
    description: 'Description'
  };

  /* ===== FIELD HELPER ===== */
  const field = (name, label, required, inputProps = {}) => (
    <div className="field">
      <label>{label}{required && <span>*</span>}</label>
      <input
        name={name}
        value={formData[name]}
        onChange={handleChange}
        ref={el => fieldRefs.current[name] = el}
        className={fieldErrors[name] ? 'input-error' : ''}
        {...inputProps}
      />
      {fieldErrors[name] && <span className="field-error-msg">{fieldErrors[name]}</span>}
    </div>
  );

  return (
    <>
      <Notification notifications={notifications} onClose={closeNotif} />

      <div className="employee-wrapper">
        <div className="employee-card">
          <div className="employee-header">
            <h2>{id ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p>Define item attributes and specifications</p>
          </div>

          {currentUserId && (
            <div className="userid-banner">
              <strong>User ID:</strong> {currentUserId} — documents can now be uploaded
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ===== BASIC INFO ===== */}
            <div className="grid-2">
              {field('firstName', 'First Name', true, { placeholder: 'Enter First Name' })}
              {field('lastName', 'Last Name', true, { placeholder: 'Enter Last Name' })}
            </div>

            <div className="grid-2">
              {field('email', 'Email ID', true, { type: 'email', placeholder: 'Email' })}
              {field('mobileNumber', 'Phone Number', true, { type: 'tel', placeholder: '10-digit mobile number', maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' })}
            </div>

            <div className="grid-2">
              <div className="field">
                <label>User Type<span>*</span></label>
                <select
                  name="role" value={formData.role} onChange={handleChange}
                  ref={el => fieldRefs.current['role'] = el}
                  className={fieldErrors['role'] ? 'input-error' : ''}
                >
                  <option value="">Select Role</option>
                  <option value="SURVEYOR">Supervisor (Employee)</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                </select>
                {fieldErrors['role'] && <span className="field-error-msg">{fieldErrors['role']}</span>}
              </div>
              {field('companyName', 'Company Name', false, { placeholder: 'Company Name' })}
            </div>

            <div className="grid-2">
              {field('address', 'Address', true, { placeholder: 'Address' })}
              {field('city', 'City', true, { placeholder: 'Enter City' })}
            </div>

            <div className="grid-2">
              {field('permanentAddress', 'Permanent Address', true, { placeholder: 'Permanent Address' })}
              {field('altMobileNumber', 'Emergency Mobile Number', false, { type: 'tel', placeholder: '10-digit emergency mobile', maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' })}
            </div>

            <div className="grid-2">
              {field('district', 'District', true, { placeholder: 'Enter District' })}
              {field('state', 'State', true, { placeholder: 'State (e.g., MH)' })}
            </div>

            <div className="grid-2">
              {field('pfNumber', 'PF Number', false, { placeholder: 'PF Number' })}
              {field('insuranceNumber', 'Insurance Number', false, { placeholder: 'Insurance Number' })}
            </div>

            <div className="grid-2">
              {field('accountNumber', 'Bank Account Number', true, { placeholder: 'Bank Account Number' })}
              {field('ifscCode', 'IFSC Code', true, { placeholder: 'IFSC Code' })}
            </div>

            <div className="grid-2">
              {field('panNumber', 'PAN Number', false, { placeholder: 'PAN Number' })}
              {field('vehicleNumber', 'Vehicle Number', false, { placeholder: 'Vehicle Number' })}
            </div>

            {/* ===== PASSWORD (new employee only) ===== */}
            {!id && (
              <>
                <div className="grid-2">
                  <div className="field">
                    <label>Password<span>*</span></label>
                    <input
                      type="password" name="password" value={formData.password}
                      onChange={handleChange} placeholder="Min. 8 characters"
                      ref={el => fieldRefs.current['password'] = el}
                      className={fieldErrors['password'] ? 'input-error' : ''}
                    />
                    {fieldErrors['password'] && <span className="field-error-msg">{fieldErrors['password']}</span>}
                    {formData.password && (
                      <span className={`pw-strength ${formData.password.length >= 8 ? 'pw-ok' : 'pw-weak'}`}>
                        {formData.password.length >= 8 ? '✓ Strong enough' : `${8 - formData.password.length} more characters needed`}
                      </span>
                    )}
                  </div>
                  <div className="field">
                    <label>Confirm Password<span>*</span></label>
                    <input
                      type="password" name="confirmPassword" value={formData.confirmPassword}
                      onChange={handleChange} placeholder="Re-enter password"
                      ref={el => fieldRefs.current['confirmPassword'] = el}
                      className={fieldErrors['confirmPassword'] ? 'input-error' : (formData.confirmPassword && formData.password === formData.confirmPassword ? 'input-success' : '')}
                    />
                    {fieldErrors['confirmPassword'] && <span className="field-error-msg">{fieldErrors['confirmPassword']}</span>}
                    {formData.confirmPassword && !fieldErrors['confirmPassword'] && formData.password === formData.confirmPassword && (
                      <span className="pw-strength pw-ok">✓ Passwords match</span>
                    )}
                  </div>
                </div>
                <div className="field full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} />
                    <span>I accept the Terms and Conditions<span>*</span></span>
                  </label>
                </div>
                <div className="field full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="acceptPrivacyPolicy" checked={formData.acceptPrivacyPolicy} onChange={handleChange} />
                    <span>I accept the Privacy Policy<span>*</span></span>
                  </label>
                </div>
              </>
            )}

            <div className="field full">
              <label>Description</label>
              <textarea rows="4" name="description" value={formData.description} onChange={handleChange} />
            </div>

            {/* ===== PHASE 1 ACTIONS ===== */}
            <div className="form-actions" style={{ marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
              {!id && (
                <button type="button" className="save-btn" onClick={handleRegister} disabled={loading || isRegistered}>
                  {isRegistered ? 'Registered ✓' : loading ? 'Registering...' : 'Register User'}
                </button>
              )}
              <button type="button" className="cancel-btn" onClick={() => navigate('/admin/employees')}>Cancel</button>
            </div>

            {/* ===== UPLOAD SECTION (Phase 2) ===== */}
            <div className="upload-grid" style={{ opacity: (isRegistered || id) ? 1 : 0.5, pointerEvents: (isRegistered || id) ? 'auto' : 'none' }}>
              {[
                { key: 'image', label: 'Upload Profile Photo', onPreview: () => setShowPreview(true) },
                { key: 'pan', label: 'Upload PAN Card', onPreview: () => files.pan && window.open(files.pan.preview, '_blank') },
                { key: 'aadhaar', label: 'Upload Aadhaar Card', onPreview: () => files.aadhaar && window.open(files.aadhaar.preview, '_blank') },
                { key: 'passbook', label: 'Upload Account Passbook', onPreview: () => files.passbook && window.open(files.passbook.preview, '_blank') },
              ].map(({ key, label, onPreview }) => (
                <div className="upload-box" key={key}>
                  <label>{label}</label>
                  <div className="upload-row">
                    <label className="upload-btn">⬆ Upload<input type="file" hidden onChange={(e) => handleFileUpload(key, e)} /></label>
                    <button type="button" className="preview-btn" onClick={onPreview}>Preview</button>
                    <button type="button" className="remove-btn" onClick={() => removeFile(key)} disabled={!files[key]}>Remove</button>
                  </div>
                  {files[key] && <p style={{ fontSize: 11, color: '#38a169', marginTop: 4 }}>✓ {files[key].file.name}</p>}
                </div>
              ))}
            </div>

            {/* ===== FINAL SAVE ===== */}
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="submit" className="save-btn" disabled={loading || (!isRegistered && !id)}>
                {loading ? 'Saving...' : id ? 'Update Employee' : 'Done — Go to List'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== PREVIEW MODAL ===== */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>NEW USER DETAILS</h3>
              <span className="close" onClick={() => setShowPreview(false)}>×</span>
            </div>
            <div className="profile-row">
              {files.image ? <img src={files.image.preview} alt="profile" /> : <div className="profile-placeholder">No Image</div>}
              <div className="profile-info">
                <div className="profile-actions">
                  <button className="edit-btn" type="button" onClick={() => setShowPreview(false)}>Edit</button>
                  <button className="block-btn" type="button">Block</button>
                </div>
              </div>
            </div>
            <div className="details-section">
              <div className="details-grid">
                {Object.entries(formData).map(([key, value]) =>
                  value && !['password', 'confirmPassword', 'acceptTerms', 'acceptPrivacyPolicy'].includes(key) ? (
                    <div key={key} className={key === 'description' ? 'detail-item full' : 'detail-item'}>
                      <span className="detail-label">{fieldLabels[key] || key}</span>
                      <span className="detail-value">{String(value)}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddEditEmployee;

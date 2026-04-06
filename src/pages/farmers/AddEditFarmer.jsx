import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { farmerApi } from '../../api/farmerApi';

const AddEditFarmer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        village: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadFarmer = async () => {
            try {
                const data = await farmerApi.getFarmerById(id);
                setFormData({
                    ...data,
                    password: ''
                });
            } catch (err) {
                setError('Failed to load farmer details');
            }
        };

        if (id) {
            loadFarmer();
        }
    }, [id]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            mobileNumber: parseInt(formData.mobileNumber)
        };

        try {
            if (id) {
                await farmerApi.updateFarmer(id, payload);
            } else {
                await farmerApi.createFarmer(payload);
            }
            navigate('/admin/farmers');
        } catch (err) {
            setError(err.message || 'Failed to save farmer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="table-container">
            <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                <h2>{id ? 'Edit Farmer' : 'Add New Farmer'}</h2>
            </div>

            <div style={{ padding: '20px' }}>
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Enter First Name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Enter Last Name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter Email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input
                                type="tel"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                placeholder="Enter Mobile"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Village</label>
                        <input
                            type="text"
                            name="village"
                            value={formData.village}
                            onChange={handleChange}
                            placeholder="Enter Village Name"
                            required
                        />
                    </div>

                    {!id && (
                        <div className="form-group">
                            <label>Initial Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter Temporary Password"
                                required={!id}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/farmers')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-success" disabled={loading}>
                            {loading ? 'Saving...' : id ? 'Update' : 'Add Farmer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditFarmer;

import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { locationService } from '../utils/locationService';

/**
 * LocationDisplay Component
 * Shows location with a modal popup for detailed view
 */
const LocationDisplay = ({ location, compact = false }) => {
  const [showModal, setShowModal] = useState(false);

  if (!location || (!location.latitude && !location.longitude)) {
    return <span style={{ color: '#999' }}>-</span>;
  }

  const { latitude, longitude, address } = location;
  const mapLink = locationService.getMapLink(latitude, longitude);

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <MapPin size={14} color="#007bff" />
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
            fontSize: '14px'
          }}
        >
          View
        </button>

        {showModal && (
          <LocationModal
            location={location}
            mapLink={mapLink}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <MapPin size={16} color="#007bff" />
        <span style={{ fontSize: '14px', color: '#333' }}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </div>
      {address && (
        <div style={{ fontSize: '12px', color: '#666', marginLeft: '21px' }}>
          {address}
        </div>
      )}
      <a
        href={mapLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#007bff',
          textDecoration: 'none',
          fontSize: '13px',
          marginLeft: '21px'
        }}
      >
        Open in Google Maps →
      </a>
    </div>
  );
};

/**
 * LocationModal Component
 * Modal popup showing location details
 */
const LocationModal = ({ location, mapLink, onClose }) => {
  const { latitude, longitude, address, timestamp } = location;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} color="#666" />
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
          <MapPin size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Location Details
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong style={{ color: '#666', fontSize: '13px' }}>Coordinates:</strong>
            <div style={{ fontSize: '15px', color: '#333', marginTop: '4px' }}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          </div>

          {address && (
            <div>
              <strong style={{ color: '#666', fontSize: '13px' }}>Address:</strong>
              <div style={{ fontSize: '15px', color: '#333', marginTop: '4px' }}>
                {address}
              </div>
            </div>
          )}

          {timestamp && (
            <div>
              <strong style={{ color: '#666', fontSize: '13px' }}>Captured At:</strong>
              <div style={{ fontSize: '15px', color: '#333', marginTop: '4px' }}>
                {new Date(timestamp).toLocaleString()}
              </div>
            </div>
          )}

          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '10px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocationDisplay;

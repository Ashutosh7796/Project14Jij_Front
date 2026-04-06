/**
 * Location Service - Handles geolocation tracking for employee attendance
 */

export const locationService = {
  /**
   * Get current location with high accuracy
   * @returns {Promise<{latitude: number, longitude: number, address: string}>}
   */
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get address from coordinates
          const address = await locationService.getAddressFromCoords(latitude, longitude);
          
          resolve({
            latitude,
            longitude,
            address,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  },

  /**
   * Get address from coordinates using reverse geocoding
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {Promise<string>}
   */
  getAddressFromCoords: async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EmployeeAttendanceApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      
      // Format address from response
      const address = data.display_name || `${latitude}, ${longitude}`;
      
      return address;
    } catch (error) {
      console.error('Error fetching address:', error);
      // Return coordinates as fallback
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  },

  /**
   * Format location for display
   * @param {object} location 
   * @returns {string}
   */
  formatLocation: (location) => {
    if (!location) return 'N/A';
    
    if (location.address) {
      return location.address;
    }
    
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    
    return 'N/A';
  },

  /**
   * Get Google Maps link for coordinates
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {string}
   */
  getMapLink: (latitude, longitude) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
};

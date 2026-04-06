/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30:00" or "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export const formatTo12Hour = (time24) => {
  if (!time24) return '-';
  
  try {
    // Extract hours and minutes from the time string
    const [hours, minutes] = time24.split(':').map(Number);
    
    // Determine AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    // Format with leading zero for minutes if needed
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hours12}:${minutesStr} ${period}`;
  } catch (error) {
    return time24; // Return original if parsing fails
  }
};

/**
 * Format total hours to readable format
 * @param {number} hours - Total hours (can be decimal)
 * @returns {string} Formatted hours (e.g., "8.5h" or "8h 30m")
 */
export const formatTotalHours = (hours) => {
  if (!hours || hours === 0) return '0h';
  
  // Round to 2 decimal places
  const roundedHours = Math.round(hours * 100) / 100;
  
  // If less than 1 hour, show in minutes
  if (roundedHours < 1) {
    const minutes = Math.round(roundedHours * 60);
    return `${minutes}m`;
  }
  
  // Split into hours and minutes
  const wholeHours = Math.floor(roundedHours);
  const remainingMinutes = Math.round((roundedHours - wholeHours) * 60);
  
  if (remainingMinutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${remainingMinutes}m`;
};

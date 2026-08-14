const AppError = require('../utils/app-error');

const lookupZipCode = async (zipCode) => {
  if (typeof zipCode !== 'string') {
    throw new AppError('ZIP code must be a string', 400);
  }

  const trimmedZip = zipCode.trim();

  if (!/^\d{5}$/.test(trimmedZip)) {
    throw new AppError('Invalid ZIP code format', 400);
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${trimmedZip}`);

    if (response.status === 404) {
      throw new AppError('ZIP code not found', 404);
    }

    if (!response.ok) {
      throw new Error(`External API returned status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      throw new AppError('ZIP code not found', 404);
    }

    const place = data.places[0];
    
    return {
      zipCode: trimmedZip,
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude)
    };
  } catch (error) {
    if (error.isOperational) {
      throw error;
    }
    console.error(`ZIP lookup failed for ${trimmedZip}:`, error.message);
    throw new AppError('External ZIP lookup service failed', 502);
  }
};

module.exports = { lookupZipCode };

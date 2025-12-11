import { useState } from 'react';
import { createTrip, getTrip } from '../api';

export const useTripPlanner = () => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTripPlan = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const newTrip = await createTrip(data);
      // Fetch full details including segments
      const fullTrip = await getTrip(newTrip.id);
      setTrip(fullTrip);
    } catch (err) {
      console.error(err);
      setError('Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    trip,
    loading,
    error,
    createTripPlan,
  };
};

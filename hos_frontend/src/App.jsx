import React, { useState } from 'react';
import TripInputForm from './components/TripInputForm';
import MapView from './components/MapView';
import LogSheet from './components/LogSheet';
import SummaryPanel from './components/SummaryPanel';
import { createTrip, getTrip } from './api';

function App() {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTripSubmit = async (data) => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HOS Trip Planner</h1>
        <p className="text-gray-600">Simulate truck trips and generate compliant log sheets.</p>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        <TripInputForm onSubmit={handleTripSubmit} isLoading={loading} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {trip && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <MapView stops={trip.stops} segments={trip.segments} />
              </div>
              <div>
                <SummaryPanel trip={trip} recaps={trip.recaps} />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Log Sheets</h2>
              {trip.recaps.map(recap => (
                <LogSheet
                  key={recap.day_index}
                  segments={trip.segments}
                  dayIndex={recap.day_index}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

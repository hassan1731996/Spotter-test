import { useState, useEffect } from 'react';
import LocationSearchInput from './LocationSearchInput';
import axios from 'axios';
import InputMapPreview from './InputMapPreview';

const TripInputForm = ({ onSubmit, isLoading, compactMode = false }) => {
  const [formData, setFormData] = useState({
    current_location: 'New York, NY',
    pickup_location: 'Philadelphia, PA',
    dropoff_location: 'Washington, DC',
    cycle_used_hours: 0,
    carrier_name: 'Spotter Logistics',
    truck_number: '101',
  });

  // Track coordinates for preview map
  const [coords, setCoords] = useState({
    current: { lat: null, lng: null },
    pickup: { lat: null, lng: null },
    dropoff: { lat: null, lng: null },
  });

  // Initial geocode for default values
  useEffect(() => {
    const fetchCoordinates = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const locations = [
        { key: 'current', query: formData.current_location },
        { key: 'pickup', query: formData.pickup_location },
        { key: 'dropoff', query: formData.dropoff_location },
      ];

      const newCoords = { ...coords };
      let changed = false;

      for (const loc of locations) {
        if (loc.query) {
          try {
            const res = await axios.get(
              `${API_BASE_URL}/geocode/?q=${encodeURIComponent(loc.query)}`
            );
            if (res.data.features && res.data.features.length > 0) {
              const [lon, lat] = res.data.features[0].geometry.coordinates;
              newCoords[loc.key] = { lat, lng: lon };
              changed = true;
            }
          } catch (err) {
            console.error(`Failed to geocode ${loc.key}:`, err);
          }
        }
      }

      if (changed) {
        setCoords(newCoords);
      }
    };

    fetchCoordinates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (field, point) => {
    setCoords((prev) => ({ ...prev, [field]: point }));
  };

  const handleLocationChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.current_location?.trim())
      newErrors.current_location = 'Current location is required';
    if (!formData.pickup_location?.trim())
      newErrors.pickup_location = 'Pickup location is required';
    if (!formData.dropoff_location?.trim())
      newErrors.dropoff_location = 'Dropoff location is required';

    const cycle = parseFloat(formData.cycle_used_hours);
    if (isNaN(cycle) || cycle < 0) newErrors.cycle_used_hours = 'Must be a positive number';
    if (cycle > 70) newErrors.cycle_used_hours = 'Cannot exceed 70 hours';

    if (!formData.carrier_name?.trim()) newErrors.carrier_name = 'Carrier name is required';
    if (!formData.truck_number?.trim()) newErrors.truck_number = 'Truck number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      ...formData,
      carrier: {
        carrier_name: formData.carrier_name,
        truck_number: formData.truck_number,
      },
    });
  };

  // Cycle calc
  const CYCLE_LIMIT = 70;
  const hoursRemaining = CYCLE_LIMIT - (parseFloat(formData.cycle_used_hours) || 0);
  const cycleColor =
    hoursRemaining < 10
      ? 'text-red-600'
      : hoursRemaining < 20
        ? 'text-amber-600'
        : 'text-emerald-600';

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white shadow-lg rounded-xl border border-slate-100"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-navy">Trip Configuration</h2>
        <div className="text-xs font-medium bg-brand-light text-brand-navy px-3 py-1 rounded-full border border-slate-200">
          Cycle: 70h/8-day
        </div>
      </div>

      <div className={`grid grid-cols-1 ${!compactMode ? 'lg:grid-cols-2' : ''} gap-8`}>
        {/* Left Column: Form Inputs */}
        <div className="space-y-6">
          {/* Location Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">
              Route Segments
            </h3>
            <div className="space-y-4">
              <div>
                <LocationSearchInput
                  id="current_location"
                  label="Current Location (Start)"
                  value={formData.current_location}
                  onChange={(val) => handleLocationChange('current_location', val)}
                  onSelectLocation={(pt) => handleLocationSelect('current', pt)}
                  error={errors.current_location}
                />
                {errors.current_location && (
                  <p className="text-xs text-red-500 mt-1 font-medium flex items-center">
                    <span className="mr-1">⚠</span> {errors.current_location}
                  </p>
                )}
              </div>
              <div>
                <LocationSearchInput
                  id="pickup_location"
                  label="Pickup Location"
                  value={formData.pickup_location}
                  onChange={(val) => handleLocationChange('pickup_location', val)}
                  onSelectLocation={(pt) => handleLocationSelect('pickup', pt)}
                  error={errors.pickup_location}
                />
                {errors.pickup_location && (
                  <p className="text-xs text-red-500 mt-1 font-medium flex items-center">
                    <span className="mr-1">⚠</span> {errors.pickup_location}
                  </p>
                )}
              </div>
              <div>
                <LocationSearchInput
                  id="dropoff_location"
                  label="Dropoff Location"
                  value={formData.dropoff_location}
                  onChange={(val) => handleLocationChange('dropoff_location', val)}
                  onSelectLocation={(pt) => handleLocationSelect('dropoff', pt)}
                  error={errors.dropoff_location}
                />
                {errors.dropoff_location && (
                  <p className="text-xs text-red-500 mt-1 font-medium flex items-center">
                    <span className="mr-1">⚠</span> {errors.dropoff_location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Carrier & Compliance Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">
              Compliance & Carrier
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cycle_used_hours"
                  className="block text-brand-navy text-sm font-semibold mb-1"
                >
                  Current Cycle Used (Hrs)
                </label>
                <div className="relative">
                  <input
                    id="cycle_used_hours"
                    type="number"
                    name="cycle_used_hours"
                    value={formData.cycle_used_hours}
                    onChange={handleChange}
                    className={`w-full p-2 pr-8 border rounded outline-none transition ${errors.cycle_used_hours ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue'}`}
                    step="0.1"
                  />
                  {errors.cycle_used_hours && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <span className="text-red-500">!</span>
                    </div>
                  )}
                </div>
                {errors.cycle_used_hours && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.cycle_used_hours}</p>
                )}
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="text-slate-500">70h/8d Limit</span>
                  <span className={`font-bold ${cycleColor}`}>
                    {hoursRemaining.toFixed(1)}h left
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="truck_number"
                  className="block text-brand-navy text-sm font-semibold mb-1"
                >
                  Assigned Truck ID
                </label>
                <div className="relative">
                  <input
                    id="truck_number"
                    type="text"
                    name="truck_number"
                    value={formData.truck_number}
                    onChange={handleChange}
                    className={`w-full p-2 pr-8 border rounded outline-none transition ${errors.truck_number ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue'}`}
                  />
                  {errors.truck_number && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <span className="text-red-500">!</span>
                    </div>
                  )}
                </div>
                {errors.truck_number && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.truck_number}</p>
                )}
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="carrier_name"
                  className="block text-brand-navy text-sm font-semibold mb-1"
                >
                  Carrier Name
                </label>
                <div className="relative">
                  <input
                    id="carrier_name"
                    type="text"
                    name="carrier_name"
                    value={formData.carrier_name}
                    onChange={handleChange}
                    className={`w-full p-2 pr-8 border rounded outline-none transition ${errors.carrier_name ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue'}`}
                  />
                  {errors.carrier_name && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <span className="text-red-500">!</span>
                    </div>
                  )}
                </div>
                {errors.carrier_name && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.carrier_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Button - Moved here for better UX when map is hidden */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2
                                ${
                                  compactMode
                                    ? 'bg-white text-brand-blue border-2 border-brand-blue hover:bg-blue-50'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl ring-offset-2 focus:ring-4 focus:ring-blue-300'
                                }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  {compactMode ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Update Plan</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Generate Compliance Plan</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Preview Map - Only show if NOT in compact mode */}
        {!compactMode && (
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">
              Route Preview
            </h3>
            <div className="flex-1 min-h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col justify-center items-center overflow-hidden h-full">
              <InputMapPreview
                locations={[
                  { ...coords.current, type: 'start' },
                  { ...coords.pickup, type: 'pickup' },
                  { ...coords.dropoff, type: 'dropoff' },
                ]}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Map updates automatically as you select locations.
            </p>
          </div>
        )}
      </div>
    </form>
  );
};

export default TripInputForm;

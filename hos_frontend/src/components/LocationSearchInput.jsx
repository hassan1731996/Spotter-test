import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LocationSearchInput = ({ label, value, onChange, onSelectLocation, id, error }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Simulate autocomplete via backend geocode proxy
  const handleSearch = async (text) => {
    onChange(text); // update parent

    if (text.length > 3) {
      try {
        // In a real app we'd use a debounce here
        // Calling our backend proxy
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const res = await axios.get(`${API_BASE_URL}/geocode/?q=${encodeURIComponent(text)}`);

        if (res.data.features) {
          setSuggestions(res.data.features);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Autocomplete error', err);
      }
    }
  };

  const handleSelect = (feature) => {
    // feature.geometry.coordinates is [lon, lat]
    const [lon, lat] = feature.geometry.coordinates;
    onChange(feature.properties.label); // Or structured address
    onSelectLocation({ lat, lng: lon });
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="block text-brand-navy text-sm font-semibold mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          className={`w-full p-2 pr-10 border rounded outline-none transition
                        ${error
              ? 'border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 text-red-900 placeholder-red-300'
              : 'border-slate-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent'
            }`}
          placeholder="Search address..."
          autoComplete="off"
        />
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className="p-2 hover:bg-brand-light cursor-pointer text-sm text-slate-700"
              onClick={() => handleSelect(item)}
            >
              {/* We are only getting the query back as label in mock, but in real ORS this would be the address */}
              {item.properties.label}
              <span className="text-xs text-gray-400 block">
                {item.geometry.coordinates[1].toFixed(4)}, {item.geometry.coordinates[0].toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;

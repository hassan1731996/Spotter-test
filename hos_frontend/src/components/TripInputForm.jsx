import React, { useState } from 'react';

const TripInputForm = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        current_location: 'New York, NY',
        pickup_location: 'Philadelphia, PA',
        dropoff_location: 'Washington, DC',
        cycle_used_hours: 0,
        carrier_name: 'Spotter Logistics',
        truck_number: '101',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            carrier: {
                carrier_name: formData.carrier_name,
                truck_number: formData.truck_number,
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-bold mb-4">Trip Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="current_location" className="block text-sm font-medium text-gray-700">Current Location</label>
                    <input id="current_location" type="text" name="current_location" value={formData.current_location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700">Pickup Location</label>
                    <input id="pickup_location" type="text" name="pickup_location" value={formData.pickup_location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                    <input id="dropoff_location" type="text" name="dropoff_location" value={formData.dropoff_location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label htmlFor="cycle_used_hours" className="block text-sm font-medium text-gray-700">Cycle Used (Hours)</label>
                    <input id="cycle_used_hours" type="number" name="cycle_used_hours" value={formData.cycle_used_hours} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label htmlFor="carrier_name" className="block text-sm font-medium text-gray-700">Carrier Name</label>
                    <input id="carrier_name" type="text" name="carrier_name" value={formData.carrier_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label htmlFor="truck_number" className="block text-sm font-medium text-gray-700">Truck Number</label>
                    <input id="truck_number" type="text" name="truck_number" value={formData.truck_number} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
            <div className="mt-4">
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isLoading ? 'Generating Plan...' : 'Generate Trip Plan'}
                </button>
            </div>
        </form>
    );
};

export default TripInputForm;

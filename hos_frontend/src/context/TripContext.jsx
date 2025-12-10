import React, { createContext, useContext } from 'react';
import { useTripPlanner } from '../hooks/useTripPlanner';

const TripContext = createContext(null);

export const TripProvider = ({ children }) => {
    const tripState = useTripPlanner();

    return (
        <TripContext.Provider value={tripState}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
};

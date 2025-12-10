import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as api from './api';

// Mock API
vi.mock('./api');

// Mock MapView (leaflet issues in test environment)
vi.mock('./components/MapView', () => ({
    default: () => <div data-testid="map-view">Map View</div>
}));

describe('App Integration', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders header', () => {
        render(<App />);
        expect(screen.getByText('HOS Trip Planner')).toBeInTheDocument();
    });

    it('handles trip generation flow', async () => {
        const mockTrip = {
            id: '123',
            stops: [],
            segments: [],
            recaps: [
                { id: '1', day_index: 1, date: '2023-01-01', driving_hours: 5.0, on_duty_hours: 1.0, cycle_remaining_hours: 60.0, cycle_used_hours: 10.0 }
            ],
            total_distance_miles: 100.0,
            total_drive_hours: 5.0,
            total_on_duty_hours: 6.0,
            cycle_used_hours: 10.0
        };

        api.createTrip.mockResolvedValue({ id: '123' });
        api.getTrip.mockResolvedValue(mockTrip);

        render(<App />);

        // Fill form
        fireEvent.change(screen.getByLabelText(/Current Location/i), { target: { value: 'A' } });
        fireEvent.change(screen.getByLabelText(/Pickup Location/i), { target: { value: 'B' } });
        fireEvent.change(screen.getByLabelText(/Dropoff Location/i), { target: { value: 'C' } });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Generate Compliance Plan/i });
        fireEvent.click(submitButton);
        // Check loading state
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText(/Simulating/i)).toBeInTheDocument();

        // Wait for result
        await waitFor(() => {
            expect(screen.getByText('Trip Summary')).toBeInTheDocument();
        });

        // Verify API calls
        expect(api.createTrip).toHaveBeenCalled();
        expect(api.getTrip).toHaveBeenCalledWith('123');

        // Verify Summary displayed
        expect(screen.getByText('100.0 mi')).toBeInTheDocument();
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    it('handles API error', async () => {
        api.createTrip.mockRejectedValue(new Error('API Fail'));

        render(<App />);

        const submitButton = screen.getByRole('button', { name: /Generate Compliance Plan/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Failed to create trip. Please try again.')).toBeInTheDocument();
        });
    });
});

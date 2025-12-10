import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TripInputForm from './TripInputForm';

describe('TripInputForm', () => {
    it('renders all inputs', () => {
        render(<TripInputForm onSubmit={() => { }} isLoading={false} />);

        expect(screen.getByLabelText(/Current Location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Pickup Location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Dropoff Location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Cycle Used/i)).toBeInTheDocument();
    });

    it('submits form data', () => {
        const handleSubmit = vi.fn();
        render(<TripInputForm onSubmit={handleSubmit} isLoading={false} />);

        fireEvent.change(screen.getByLabelText(/Current Location/i), { target: { value: 'Loc A' } });
        fireEvent.change(screen.getByLabelText(/Pickup Location/i), { target: { value: 'Loc B' } });
        fireEvent.change(screen.getByLabelText(/Dropoff Location/i), { target: { value: 'Loc C' } });

        fireEvent.click(screen.getByRole('button'));

        expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
            current_location: 'Loc A',
            pickup_location: 'Loc B',
            dropoff_location: 'Loc C'
        }));
    });

    it('disables button when loading', () => {
        render(<TripInputForm onSubmit={() => { }} isLoading={true} />);
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText(/Simulating/i)).toBeInTheDocument();
    });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SummaryPanel from './SummaryPanel';

describe('SummaryPanel', () => {
    it('renders nothing when no trip', () => {
        render(<SummaryPanel trip={null} recaps={[]} />);
        expect(screen.queryByText('Trip Summary')).not.toBeInTheDocument();
    });

    it('renders trip stats and recaps', () => {
        const trip = {
            total_distance_miles: '500.50',
            total_drive_hours: '8.50',
            total_on_duty_hours: '9.00',
            cycle_used_hours: '20.00'
        };
        const recaps = [
            { id: '1', day_index: 1, date: '2023-10-10', driving_hours: '8.50', on_duty_hours: '0.50', cycle_remaining_hours: '50.00' }
        ];

        render(<SummaryPanel trip={trip} recaps={recaps} />);

        expect(screen.getByText('Trip Summary')).toBeInTheDocument();

        expect(screen.getByText('500.5 mi')).toBeInTheDocument();
        expect(screen.getByText('8.5 hrs')).toBeInTheDocument();

        // Table row
        expect(screen.getByText('2023-10-10')).toBeInTheDocument();
        expect(screen.getByText('50.00')).toBeInTheDocument();
    });
});

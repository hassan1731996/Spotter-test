
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LogSheet = ({ segments, dayIndex }) => {
  // Filter segments for this day
  const daySegments = segments.filter((s) => s.day_index === dayIndex);

  // Prepare data for Chart.js
  // We want a stepped line chart.
  // X axis: Time (0-24h)
  // Y axis: Status (Off=3, Sleeper=2, Driving=1, OnDuty=0) - inverted for visual standard?
  // Standard Log: Off(top), Sleeper, Driving, OnDuty(bottom).
  // Let's map: Off=4, Sleeper=3, Driving=2, OnDuty=1

  // We need to render the grid

  // Initial point at 00:00
  if (daySegments.length > 0) {
    // Assume starts at 00:00 for simplicity or use actual start time relative to day start
    // For now, just map segments
  }

  // Simplified: just list segments
  return (
    <div className="bg-white p-4 shadow rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-2">Log Sheet - Day {dayIndex}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Time</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Duration</th>
              <th className="border p-2">Location</th>
              <th className="border p-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {daySegments.map((seg) => (
              <tr key={seg.id}>
                <td className="border p-2">
                  {new Date(seg.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -
                  {new Date(seg.end_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="border p-2 capitalize">{seg.status.replace('_', ' ')}</td>
                <td className="border p-2">{seg.duration_minutes} min</td>
                <td className="border p-2">{seg.location}</td>
                <td className="border p-2">{seg.remarks || seg.activity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogSheet;

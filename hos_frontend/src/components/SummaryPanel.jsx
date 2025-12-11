

const SummaryPanel = ({ trip, recaps }) => {
  if (!trip) return null;

  return (
    <div className="bg-white p-4 shadow rounded-lg mt-4">
      <h2 className="text-xl font-bold mb-4">Trip Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-sm text-gray-500">Total Distance</div>
          <div className="text-lg font-bold">{Number(trip.total_distance_miles).toFixed(1)} mi</div>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <div className="text-sm text-gray-500">Drive Time</div>
          <div className="text-lg font-bold">{Number(trip.total_drive_hours).toFixed(1)} hrs</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
          <div className="text-sm text-gray-500">On Duty Time</div>
          <div className="text-lg font-bold">{Number(trip.total_on_duty_hours).toFixed(1)} hrs</div>
        </div>
        <div className="p-3 bg-purple-50 rounded">
          <div className="text-sm text-gray-500">Cycle Used</div>
          <div className="text-lg font-bold">{Number(trip.cycle_used_hours).toFixed(1)} hrs</div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2">Daily Recap</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Day</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Driving</th>
              <th className="p-2 text-right">On Duty</th>
              <th className="p-2 text-right">Cycle Rem</th>
            </tr>
          </thead>
          <tbody>
            {recaps.map((recap) => (
              <tr key={recap.id} className="border-t">
                <td className="p-2">{recap.day_index}</td>
                <td className="p-2">{recap.date}</td>
                <td className="p-2 text-right">{recap.driving_hours}</td>
                <td className="p-2 text-right">{recap.on_duty_hours}</td>
                <td className="p-2 text-right">{recap.cycle_remaining_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryPanel;

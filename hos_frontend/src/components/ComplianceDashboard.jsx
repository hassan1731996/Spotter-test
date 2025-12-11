import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Gauge = ({ value, max, label, color }) => {
  const data = {
    labels: ['Used', 'Remaining'],
    datasets: [
      {
        data: [value, Math.max(0, max - value)],
        backgroundColor: [color, '#e2e8f0'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }, // Simple gauge
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-bold text-brand-navy">{value.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400">of {max}h</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-slate-600">{label}</span>
    </div>
  );
};

const ComplianceDashboard = ({ recaps }) => {
  // Show data for the first day/recap available or aggregate
  // For dashboard, usually we show "Today"
  const today = recaps && recaps.length > 0 ? recaps[0] : null;

  if (!today) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-slate-200 ">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">
        Compliance Status
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Gauge value={Number(today.driving_hours)} max={11} label="Drive Time" color="#3b82f6" />
        <Gauge
          value={Number(today.on_duty_hours) + Number(today.driving_hours)}
          max={14}
          label="Shift Window"
          color="#f59e0b"
        />

        <div className="col-span-2 flex flex-col justify-center bg-brand-light rounded p-4 border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-600">Cycle (70h/8d)</span>
            <span
              className={`text-xl font-bold ${Number(today.cycle_remaining_hours) < 10 ? 'text-brand-error' : 'text-brand-success'}`}
            >
              {Number(today.cycle_remaining_hours).toFixed(1)}h Left
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${Number(today.cycle_remaining_hours) < 10 ? 'bg-brand-error' : 'bg-brand-success'}`}
              style={{ width: `${(Number(today.cycle_used_hours) / 70) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;

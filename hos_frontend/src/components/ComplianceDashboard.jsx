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
      <div className="space-y-4">
        {/* Drive Time Progress Bar */}
        <div className="flex flex-col justify-center bg-brand-light rounded p-4 border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-600">Drive Time</span>
            <span className={`text-xl font-bold ${Number(today.driving_hours) > 9 ? 'text-brand-error' : 'text-brand-navy'}`}>
              {Number(today.driving_hours).toFixed(1)}h / 11h
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${Number(today.driving_hours) > 9 ? 'bg-brand-error' : 'bg-blue-500'}`}
              style={{ width: `${(Number(today.driving_hours) / 11) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Shift Window Progress Bar */}
        <div className="flex flex-col justify-center bg-brand-light rounded p-4 border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-600">Shift Window</span>
            <span className={`text-xl font-bold ${(Number(today.on_duty_hours) + Number(today.driving_hours)) > 12 ? 'text-brand-error' : 'text-brand-navy'}`}>
              {(Number(today.on_duty_hours) + Number(today.driving_hours)).toFixed(1)}h / 14h
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${(Number(today.on_duty_hours) + Number(today.driving_hours)) > 12 ? 'bg-brand-error' : 'bg-amber-500'}`}
              style={{ width: `${((Number(today.on_duty_hours) + Number(today.driving_hours)) / 14) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="flex flex-col justify-center bg-brand-light rounded p-4 border border-slate-100">
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

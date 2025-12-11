import TripInputForm from './components/TripInputForm';
import MapView from './components/MapView';
import LogSheetGrid from './components/LogSheetGrid';
import ComplianceDashboard from './components/ComplianceDashboard';
import SummaryPanel from './components/SummaryPanel';
import { TripProvider, useTrip } from './context/TripContext';

function MainContent() {
  const { trip, loading, error, createTripPlan } = useTrip();

  const handleTripSubmit = (data) => {
    createTripPlan(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4 font-sans text-slate-800">
      <header
        className={`mb-4 transition-all duration-300 ${trip ? 'flex items-center justify-between px-2' : 'text-center'}`}
      >
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy tracking-tight">
            HOS Trip Planner
          </h1>
          <p className="text-sm text-slate-500 hidden md:block">
            Compliance & Route Simulation Engine
          </p>
        </div>
      </header>

      <main
        className={`mx-auto transition-all duration-500 ${trip ? 'w-full p-8' : 'max-w-4xl'}`}
      >
        <div
          className={`grid gap-4 ${trip ? 'grid-cols-1 lg:grid-cols-12 items-start' : 'grid-cols-1'}`}
        >
          {/* Input Form Column */}
          <div className={`${trip ? 'lg:col-span-3 xl:col-span-2' : ''} transition-all`}>
            <TripInputForm onSubmit={handleTripSubmit} isLoading={loading} compactMode={!!trip} />

            {error && (
              <div
                className="mt-4 bg-red-50 border-l-4 border-brand-error text-red-700 p-3 rounded text-sm shadow-sm"
                role="alert"
              >
                <p className="font-bold">Simulation Error</p>
                <p>{error}</p>

              </div>
            )}
            {trip && <div className="xl:col-span-1 flex flex-col gap-4 h-full overflow-y-auto pr-1 mt-4">
              <ComplianceDashboard recaps={trip.recaps} trip={trip} />
              <SummaryPanel trip={trip} recaps={trip.recaps} />
            </div>}
          </div>


          {/* Results Column */}
          {trip && (
            <div className="lg:col-span-9 xl:col-span-10 space-y-4 animate-fadeIn">
              {/* Upper Dashboard: Map + Status */}
              <div className="h-[500px]">
                {/* Main Map - Takes 2/3 width on huge screens, full on large */}
                <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                  <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-bold text-brand-navy">
                    Interactive Route Map
                  </div>
                  <div className="h-full w-full">
                    <MapView stops={trip.stops} segments={trip.segments} />
                  </div>
                </div>

                {/* Right Side Stats Panel */}

              </div>

              {/* Bottom Section: Logs */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-lg font-bold text-brand-navy mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-brand-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  Daily Duty Status Logs
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {trip.recaps.map((recap) => (
                    <LogSheetGrid
                      key={recap.day_index}
                      segments={trip.segments}
                      dayIndex={recap.day_index}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <TripProvider>
      <MainContent />
    </TripProvider>
  );
}

export default App;

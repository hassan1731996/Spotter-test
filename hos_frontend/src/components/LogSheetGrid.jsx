import React, { useMemo, useState } from 'react';
import DutyStatusBlock from './DutyStatusBlock';

const STATUS_ROWS = {
    'off_duty': 0,
    'sleeper': 1,
    'driving': 2,
    'on_duty': 3,
};

const ROW_HEIGHT = 40;
const GRID_WIDTH = 960; // 24 hours * 40px/hour (convenient for 15m = 10px)
const START_X = 60; // Left margin for labels

const LogSheetGrid = ({ segments, dayIndex }) => {
    const [hoveredSegment, setHoveredSegment] = useState(null);

    // Filter segments for this day
    const daySegments = useMemo(() => {
        if (!segments) return [];
        return segments.filter(s => s.day_index === dayIndex).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }, [segments, dayIndex]);

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 overflow-x-auto">
            <h3 className="text-lg font-bold text-brand-navy mb-4">Driver's Daily Log (Day {dayIndex})</h3>

            <div className="relative min-w-[1024px]">
                <svg width={GRID_WIDTH + 100} height={ROW_HEIGHT * 4 + 50}>
                    {/* Background Grid */}
                    <g className="grid-lines">
                        {/* Horizontal Lines */}
                        {[0, 1, 2, 3, 4].map(i => (
                            <line
                                key={`h-${i}`}
                                x1={START_X} y1={i * ROW_HEIGHT}
                                x2={START_X + GRID_WIDTH} y2={i * ROW_HEIGHT}
                                stroke="#e2e8f0" strokeWidth="1"
                            />
                        ))}
                        {/* Vertical Hour Lines */}
                        {Array.from({ length: 25 }).map((_, h) => {
                            const x = START_X + (h / 24) * GRID_WIDTH;
                            return (
                                <g key={`v-${h}`}>
                                    <line x1={x} y1={0} x2={x} y2={ROW_HEIGHT * 4} stroke="#e2e8f0" strokeWidth={1} />
                                    <text x={x} y={ROW_HEIGHT * 4 + 20} textAnchor="middle" fontSize="10" fill="#64748b">{h}:00</text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Y-Axis Labels */}
                    <g className="labels">
                        {Object.entries(STATUS_ROWS).map(([status, row]) => (
                            <text
                                key={status}
                                x={START_X - 10}
                                y={row * ROW_HEIGHT + (ROW_HEIGHT / 2) + 4}
                                textAnchor="end"
                                fontSize="10"
                                fontWeight="bold"
                                fill="#475569"
                                className="uppercase"
                            >
                                {status.replace('_', ' ')}
                            </text>
                        ))}
                    </g>

                    {/* Duty Status Block (Polyline + Overlay) */}
                    <DutyStatusBlock
                        daySegments={daySegments}
                        onHover={setHoveredSegment}
                    />

                </svg>

                {/* Hover Tooltip/Info */}
                <div className="mt-4 h-12 border-t border-slate-100 pt-2 text-sm">
                    {hoveredSegment ? (
                        <div className="flex items-center space-x-4 animate-fadeIn">
                            <span className="font-bold text-brand-blue">{hoveredSegment.activity}</span>
                            <span className="text-slate-500">
                                {new Date(hoveredSegment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                {new Date(hoveredSegment.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs uppercase font-semibold text-slate-600">
                                {hoveredSegment.status.replace('_', ' ')}
                            </span>
                            <span className="text-slate-500 italic">{hoveredSegment.location}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">Hover over the graph to see details</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogSheetGrid;

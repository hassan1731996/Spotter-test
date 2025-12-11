import { useMemo } from 'react';

const STATUS_ROWS = {
  off_duty: 0,
  sleeper: 1,
  driving: 2,
  on_duty: 3,
};

const ROW_HEIGHT = 40;
const GRID_WIDTH = 960;
const START_X = 60;

const DutyStatusBlock = ({ daySegments, onHover }) => {
  // Calculate X position from ISO string
  const getTimeX = (dtString) => {
    const d = new Date(dtString);
    const h = d.getHours();
    const m = d.getMinutes();
    return START_X + ((h * 60 + m) / (24 * 60)) * GRID_WIDTH;
  };

  // Calculate Polyline Points
  const points = useMemo(() => {
    let pts = [];
    if (!daySegments || daySegments.length === 0) return '';

    let firstSeg = daySegments[0];
    let currentX = getTimeX(firstSeg.start_time);
    let currentY = STATUS_ROWS[firstSeg.status] * ROW_HEIGHT + ROW_HEIGHT / 2;

    pts.push(`${currentX},${currentY}`);

    daySegments.forEach((seg) => {
      const row = STATUS_ROWS[seg.status];
      if (row === undefined) return;

      const startX = getTimeX(seg.start_time);
      const endX = getTimeX(seg.end_time);
      const y = row * ROW_HEIGHT + ROW_HEIGHT / 2;

      if (currentY !== y) {
        pts.push(`${startX},${y}`); // Vertical
      }
      pts.push(`${endX},${y}`); // Horizontal

      currentX = endX;
      currentY = y;
    });

    return pts.join(' ');
  }, [daySegments]);

  return (
    <g className="duty-status-block">
      {/* The Log Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#0f172a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Interactive Overlay */}
      {daySegments.map((seg, i) => {
        const startX = getTimeX(seg.start_time);
        const endX = getTimeX(seg.end_time);
        const row = STATUS_ROWS[seg.status];
        if (row === undefined) return null;

        return (
          <rect
            key={i}
            x={startX}
            y={row * ROW_HEIGHT}
            width={Math.max(endX - startX, 2)}
            height={ROW_HEIGHT}
            fill="transparent"
            className="hover:fill-blue-500/10 cursor-pointer"
            onMouseEnter={() => onHover(seg)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </g>
  );
};

export default DutyStatusBlock;

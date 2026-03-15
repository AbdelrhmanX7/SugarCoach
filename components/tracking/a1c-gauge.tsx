"use client";

type A1CGaugeProps = {
  currentA1C: number;
  targetA1C: number | null;
};

// Map A1C value (4-14) to angle on semicircle (180 to 0 degrees, left to right)
function a1cToAngle(a1c: number): number {
  const min = 4;
  const max = 14;
  const clamped = Math.max(min, Math.min(max, a1c));
  const ratio = (clamped - min) / (max - min);

  // 180 degrees = left side (low), 0 degrees = right side (high)
  return 180 - ratio * 180;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  // Sweep flag: 0 for counterclockwise (from higher angle to lower angle)
  const sweep = startAngle > endAngle ? 0 : 1;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

// Color zones based on A1C ranges
const zones = [
  { minA1C: 4, maxA1C: 5.7, color: "#22c55e", label: "Normal" },
  { minA1C: 5.7, maxA1C: 6.4, color: "#eab308", label: "Prediabetes" },
  { minA1C: 6.4, maxA1C: 7, color: "#f97316", label: "Controlled" },
  { minA1C: 7, maxA1C: 14, color: "#ef4444", label: "High" },
];

export function A1CGauge({ currentA1C, targetA1C }: A1CGaugeProps) {
  const cx = 150;
  const cy = 140;
  const radius = 110;
  const strokeWidth = 22;

  const needleAngle = a1cToAngle(currentA1C);
  const needleTip = polarToCartesian(
    cx,
    cy,
    radius - strokeWidth / 2 - 4,
    needleAngle,
  );
  const needleBase1 = polarToCartesian(cx, cy, 8, needleAngle + 90);
  const needleBase2 = polarToCartesian(cx, cy, 8, needleAngle - 90);

  return (
    <div className="flex flex-col items-center">
      <svg
        aria-label={`A1C gauge showing ${currentA1C}%`}
        className="w-full max-w-[320px]"
        viewBox="0 0 300 175"
      >
        {/* Background track */}
        <path
          className="text-default-200 dark:text-default-100"
          d={describeArc(cx, cy, radius, 180, 0)}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />

        {/* Color zone arcs */}
        {zones.map((zone) => {
          const startAngle = a1cToAngle(zone.minA1C);
          const endAngle = a1cToAngle(zone.maxA1C);

          return (
            <path
              key={zone.label}
              d={describeArc(cx, cy, radius, startAngle, endAngle)}
              fill="none"
              opacity={0.85}
              stroke={zone.color}
              strokeWidth={strokeWidth}
            />
          );
        })}

        {/* Target marker */}
        {targetA1C != null && (
          <>
            {(() => {
              const targetAngle = a1cToAngle(targetA1C);
              const outer = polarToCartesian(
                cx,
                cy,
                radius + strokeWidth / 2 + 2,
                targetAngle,
              );
              const inner = polarToCartesian(
                cx,
                cy,
                radius - strokeWidth / 2 - 2,
                targetAngle,
              );

              return (
                <g>
                  <line
                    className="text-foreground"
                    stroke="currentColor"
                    strokeDasharray="3 2"
                    strokeWidth={2.5}
                    x1={outer.x}
                    x2={inner.x}
                    y1={outer.y}
                    y2={inner.y}
                  />
                  <text
                    className="fill-default-500 text-[9px] font-medium"
                    textAnchor="middle"
                    x={outer.x}
                    y={outer.y - 6}
                  >
                    Target
                  </text>
                </g>
              );
            })()}
          </>
        )}

        {/* Needle */}
        <polygon
          className="fill-foreground"
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        />
        <circle className="fill-foreground" cx={cx} cy={cy} r={10} />
        <circle className="fill-content1" cx={cx} cy={cy} r={5} />

        {/* Scale labels */}
        {[4, 6, 8, 10, 12, 14].map((val) => {
          const angle = a1cToAngle(val);
          const pos = polarToCartesian(
            cx,
            cy,
            radius + strokeWidth / 2 + 12,
            angle,
          );

          return (
            <text
              key={val}
              className="fill-default-400 text-[10px] font-medium"
              textAnchor="middle"
              x={pos.x}
              y={pos.y + 3}
            >
              {val}
            </text>
          );
        })}

        {/* Center text */}
        <text
          className="fill-foreground text-[28px] font-bold"
          textAnchor="middle"
          x={cx}
          y={cy - 20}
        >
          {currentA1C.toFixed(1)}%
        </text>
        <text
          className="fill-default-500 text-[11px] font-medium"
          textAnchor="middle"
          x={cx}
          y={cy - 4}
        >
          Current A1C
        </text>
      </svg>

      {/* Zone legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
        {zones.map((zone) => (
          <div key={zone.label} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: zone.color }}
            />
            <span className="text-default-500">{zone.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

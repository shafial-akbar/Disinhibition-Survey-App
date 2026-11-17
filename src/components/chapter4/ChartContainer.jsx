import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import { formatApaNoLeadingZero } from '../../services/chapter4/apa7Formatter';

const ACADEMIC_PALETTE = ['#1e3a8a', '#3b82f6', '#0f766e', '#64748b', '#475569', '#94a3b8'];

/**
 * Reusable Academic Chart Container for APA 7 Figures (Figures 1 to 16)
 * Supports: 'bar', 'horizontalBar', 'pie', 'histogram', 'qq', 'heatmap', 'scatter'
 */
export default function ChartContainer({
  type = 'bar',
  data = [],
  xKey = 'label',
  yKey = 'count',
  xLabel = '',
  yLabel = '',
  regression = null,
  matrixCodes = ['PCW', 'PT', 'WSD'],
  matrixData = {},
  height = 240,
}) {
  if (type === 'heatmap') {
    const codes = matrixCodes || ['PCW', 'PT', 'WSD'];
    return (
      <div style={{ padding: '8px 4px' }}>
        <div
          className="apa-heatmap-grid"
          style={{ gridTemplateColumns: `90px repeat(${codes.length}, 1fr)` }}
        >
          <div className="apa-heatmap-cell" style={{ fontWeight: 700, background: '#f8fafc' }}>
            Construct
          </div>
          {codes.map(c => (
            <div key={c} className="apa-heatmap-cell" style={{ fontWeight: 700, background: '#f8fafc' }}>
              {c}
            </div>
          ))}

          {codes.map(rCode => (
            <React.Fragment key={rCode}>
              <div className="apa-heatmap-cell" style={{ fontWeight: 700, background: '#f8fafc' }}>
                {rCode}
              </div>
              {codes.map(cCode => {
                const isDiag = rCode === cCode;
                const val = isDiag ? 1 : matrixData?.[rCode]?.[cCode]?.r ?? 0;
                const absVal = Math.min(1, Math.abs(Number(val) || 0));
                const bg = isDiag
                  ? '#e2e8f0'
                  : val >= 0
                  ? `rgba(30, 58, 138, ${0.1 + absVal * 0.45})`
                  : `rgba(185, 28, 28, ${0.1 + absVal * 0.45})`;
                const textColor = !isDiag && absVal > 0.65 ? '#ffffff' : '#0f172a';
                return (
                  <div
                    key={`${rCode}-${cCode}`}
                    className="apa-heatmap-cell"
                    style={{ background: bg, color: textColor, fontWeight: isDiag ? 700 : 600 }}
                  >
                    {isDiag ? '1.000' : formatApaNoLeadingZero(val, 3)}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
        Insufficient observations to render chart.
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={78}
              isAnimationActive={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={ACADEMIC_PALETTE[idx % ACADEMIC_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'horizontalBar') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 24, left: 36, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey={xKey} width={115} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar
              dataKey={yKey}
              fill="#1e3a8a"
              radius={[0, 3, 3, 0]}
              name="Count (n)"
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'qq') {
    // shapiroWilk.js produces { theoretical, observed, rawValue }
    const coords = data
      .flatMap(d => [Number(d.theoretical), Number(d.observed)])
      .filter(Number.isFinite);
    const maxAbs = coords.length
      ? Math.max(2.5, Math.ceil(Math.max(...coords.map(Math.abs)) * 2) / 2)
      : 3;

    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 12, right: 24, bottom: 24, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="theoretical"
              name="Theoretical Quantile (z)"
              domain={[-maxAbs, maxAbs]}
              tick={{ fontSize: 11 }}
              label={{
                value: 'Theoretical Normal Quantile (z)',
                position: 'insideBottom',
                offset: -12,
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="observed"
              name="Observed z-Score"
              domain={[-maxAbs, maxAbs]}
              tick={{ fontSize: 11 }}
              label={{ value: 'Observed z-Score', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine
              segment={[
                { x: -maxAbs, y: -maxAbs },
                { x: maxAbs, y: maxAbs },
              ]}
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Scatter
              data={data}
              fill="#1e3a8a"
              fillOpacity={0.85}
              name="Observed Quantiles"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'scatter') {
    const xs = data.map(d => Number(d.x)).filter(Number.isFinite);
    const minX = xs.length ? Math.min(...xs) : 1;
    const maxX = xs.length ? Math.max(...xs) : 5;
    const hasTrend =
      regression && Number.isFinite(regression.slope) && Number.isFinite(regression.intercept);

    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 12, right: 24, bottom: 24, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel || 'Predictor'}
              domain={[1, 5]}
              tick={{ fontSize: 11 }}
              label={{
                value: xLabel || 'Predictor (1–5)',
                position: 'insideBottom',
                offset: -12,
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel || 'Outcome'}
              domain={[1, 5]}
              tick={{ fontSize: 11 }}
              label={{
                value: yLabel || 'Outcome (1–5)',
                angle: -90,
                position: 'insideLeft',
                fontSize: 11,
              }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {hasTrend && (
              <ReferenceLine
                segment={[
                  { x: minX, y: regression.intercept + regression.slope * minX },
                  { x: maxX, y: regression.intercept + regression.slope * maxX },
                ]}
                stroke="#0f766e"
                strokeWidth={2}
              />
            )}
            <Scatter
              data={data}
              fill="#1e3a8a"
              fillOpacity={0.8}
              name="Participant Score Pair"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default vertical bar / histogram
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11 }}
            interval={0}
            angle={data.length > 5 ? -18 : 0}
            textAnchor={data.length > 5 ? 'end' : 'middle'}
            height={data.length > 5 ? 48 : 30}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar
            dataKey={yKey}
            fill={type === 'histogram' ? '#0f766e' : '#1e3a8a'}
            radius={[3, 3, 0, 0]}
            name="Frequency (n)"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

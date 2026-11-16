import React, { useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportChartElementAsPng } from '../../services/export/pngExportService';

const PALETTE = ['#1d4ed8', '#0284c7', '#0f766e', '#d97706', '#7c3aed', '#be123c', '#475569'];

export default function AdminChart({
  title,
  subtitle,
  type = 'bar',
  data = [],
  xKey = 'name',
  yKey = 'value',
  height = 290,
  filename = 'chart.png',
  trendLine = [],
  xLabel = '',
  yLabel = '',
  domainX,
  domainY,
}) {
  const chartRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    setDownloading(true);
    try {
      await exportChartElementAsPng(chartRef.current, filename);
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="admin-card" ref={chartRef}>
      <div className="admin-card-header">
        <div>
          {title && <h3 className="admin-card-title">{title}</h3>}
          {subtitle && <p className="admin-card-sub">{subtitle}</p>}
        </div>
        {data && data.length > 0 && (
          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={13} /> {downloading ? 'Saving...' : 'PNG'}
          </button>
        )}
      </div>

      {!data || data.length === 0 ? (
        <div
          style={{
            height: Math.min(height, 180),
            display: 'grid',
            placeItems: 'center',
            color: '#64748b',
            fontSize: 13,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px dashed #cbd5e1',
          }}
        >
          No data available yet.
        </div>
      ) : (
        <div className="analysis-chart-box" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={yKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={92}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : type === 'horizontalBar' ? (
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey={xKey} width={135} tick={{ fontSize: 11.5 }} />
                <Tooltip />
                <Bar dataKey={yKey} fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            ) : type === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11.5 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey={yKey} stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3.5 }} />
              </LineChart>
            ) : type === 'scatter' ? (
              <ScatterChart margin={{ top: 12, right: 20, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey={xKey}
                  name={xLabel || xKey}
                  domain={domainX || [1, 5]}
                  tick={{ fontSize: 12 }}
                  label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -12, fontSize: 12 } : undefined}
                />
                <YAxis
                  type="number"
                  dataKey={yKey}
                  name={yLabel || yKey}
                  domain={domainY || [1, 5]}
                  tick={{ fontSize: 12 }}
                  label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12 } : undefined}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Participants" data={data} fill="#1d4ed8" fillOpacity={0.75} />
                {trendLine && trendLine.length === 2 && (
                  <ReferenceLine
                    segment={[
                      { x: trendLine[0].x, y: trendLine[0].y },
                      { x: trendLine[1].x, y: trendLine[1].y },
                    ]}
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}
              </ScatterChart>
            ) : type === 'qq' ? (
              <ScatterChart margin={{ top: 12, right: 20, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="theoretical"
                  name="Theoretical Normal Z"
                  domain={[-3, 3]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Theoretical Normal Quantile (Z)', position: 'insideBottom', offset: -12, fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="observed"
                  name="Observed Z"
                  domain={[-3, 3]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Observed Z', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip />
                <Scatter name="Quantile Points" data={data} fill="#0284c7" />
                <ReferenceLine
                  segment={[
                    { x: -2.8, y: -2.8 },
                    { x: 2.8, y: 2.8 },
                  ]}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </ScatterChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11.5 }} interval={0} angle={data.length > 5 ? -18 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 55 : 30} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={yKey} fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

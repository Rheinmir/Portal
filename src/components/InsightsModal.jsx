import React from 'react';
import { Download, X, BarChart as ChartIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Need to match the CHART_COLORS variable from App.jsx or define here
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function InsightsModal({
  isOpen,
  onClose,
  data,
  onExportStats,
  onExportSummary,
  modalClass
}) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 ${modalClass}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <ChartIcon className="text-orange-500" /> Phân tích
            </h3>
            <button
              onClick={onExportStats}
              className="text-xs flex items-center gap-1 text-blue-500 hover:underline bg-blue-500/10 px-2 py-1 rounded"
            >
              <Download size={12} /> Xuất CSV đầy đủ
            </button>
            <button
              onClick={onExportSummary}
              className="text-xs flex items-center gap-1 text-emerald-500 hover:underline bg-emerald-500/10 px-2 py-1 rounded"
            >
              <Download size={12} /> CSV tóm tắt
            </button>
          </div>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm opacity-70">Tổng Click</p>
            <p className="text-3xl font-bold text-blue-500">{data.totalClicks}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm opacity-70">Top 1 App</p>
            <p className="text-xl font-bold text-purple-500 truncate">
              {data.topApps[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-500/20">
            <h4 className="text-sm font-bold mb-4 opacity-80">Top 10 Ứng Dụng</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topApps}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.topApps.map((a, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-gray-500/20">
            <h4 className="text-sm font-bold mb-4 opacity-80">Hoạt động (7 ngày qua)</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeline}>
                  <XAxis
                    dataKey="d"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-gray-500/20">
            <h4 className="text-sm font-bold mb-4 opacity-80">Theo giờ</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.hourly.map((h) => ({
                    hour: `${h.h}h`,
                    count: h.count
                  }))}
                >
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

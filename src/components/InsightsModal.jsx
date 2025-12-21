import React from "react";
import { Download, X, BarChart as ChartIcon, Image } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Need to match the CHART_COLORS variable from App.jsx or define here
const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

// Helper to format bytes
const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function InsightsModal({
  isOpen,
  onClose,
  data,
  onExportStats,
  onExportSummary,
  modalClass,
  isAdmin,
}) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${modalClass}`}
      >
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0">
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
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content with hidden scrollbar */}
        <div
          className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm opacity-70">Tổng Click</p>
              <p className="text-3xl font-bold text-blue-500">
                {data.totalClicks}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm opacity-70">Top 1 App</p>
              <p className="text-xl font-bold text-purple-500 truncate">
                {data.topApps[0]?.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-gray-500/20">
              <h4 className="text-sm font-bold mb-4 opacity-80">
                Top 10 Ứng Dụng
              </h4>
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
                    <Tooltip cursor={{ fill: "rgba(148,163,184,0.15)" }} />
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
              <h4 className="text-sm font-bold mb-4 opacity-80">
                Hoạt động (7 ngày qua)
              </h4>
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
                    <Tooltip cursor={{ fill: "rgba(148,163,184,0.15)" }} />
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
                      count: h.count,
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
                    <Tooltip cursor={{ fill: "rgba(148,163,184,0.15)" }} />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Image Search Logs - Admin Only */}
            {isAdmin &&
              data.imageSearchLogs &&
              data.imageSearchLogs.length > 0 && (
                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <h4 className="text-sm font-bold mb-4 opacity-80 flex items-center gap-2">
                    <Image size={16} className="text-orange-500" />
                    Image Search Logs ({data.imageSearchLogs.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-500/20">
                          <th className="text-left py-2 px-2 opacity-70">
                            Thời gian
                          </th>
                          <th className="text-left py-2 px-2 opacity-70">IP</th>
                          <th className="text-left py-2 px-2 opacity-70">
                            Loại
                          </th>
                          <th className="text-left py-2 px-2 opacity-70">
                            Size
                          </th>
                          <th className="text-left py-2 px-2 opacity-70">
                            User Agent
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.imageSearchLogs.slice(0, 20).map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-gray-500/10 hover:bg-gray-500/5"
                          >
                            <td className="py-2 px-2 whitespace-nowrap">
                              {formatDate(log.searched_at)}
                            </td>
                            <td className="py-2 px-2 font-mono text-orange-400">
                              {log.client_ip}
                            </td>
                            <td className="py-2 px-2">{log.file_type}</td>
                            <td className="py-2 px-2">
                              {formatBytes(log.file_size)}
                            </td>
                            <td
                              className="py-2 px-2 max-w-[200px] truncate opacity-60"
                              title={log.user_agent}
                            >
                              {log.user_agent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Global style for hiding scrollbar in webkit */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

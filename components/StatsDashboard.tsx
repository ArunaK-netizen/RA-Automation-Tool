'use client'

import { Allocation, SlotMap } from '@/lib/types'
import { calculateStats } from '@/lib/utils'
import { Users, BookOpen, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  allocations: Allocation[]
  slotMap: SlotMap
}

export default function StatsDashboard({ allocations, slotMap }: Props) {
  const stats = calculateStats(allocations)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="text-blue-600" />}
          title="Total RAs"
          value={stats.totalRAs}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<BookOpen className="text-green-600" />}
          title="Total Labs"
          value={stats.totalLabs}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="text-purple-600" />}
          title="Avg Labs/RA"
          value={stats.avgLabsPerRA.toFixed(1)}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<AlertTriangle className="text-red-600" />}
          title="Discrepancies"
          value={stats.totalDiscrepancies}
          bgColor="bg-red-50"
        />
      </div>

      {/* Min/Max Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Lowest Labs Assigned</h3>
          <p className="text-2xl font-bold text-green-600">{stats.minLabs}</p>
          <p className="text-sm text-gray-600">{stats.raWithMinLabs}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Highest Labs Assigned</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.maxLabs}</p>
          <p className="text-sm text-gray-600">{stats.raWithMaxLabs}</p>
        </div>
      </div>

      {/* Course Distribution Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Course Distribution (Top 10)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.courseDistribution.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RA Details Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">RA Allocation Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3">RA Name</th>
                <th className="text-center py-2 px-3">Required</th>
                <th className="text-center py-2 px-3">Assigned</th>
                <th className="text-center py-2 px-3">Courses</th>
                <th className="text-left py-2 px-3">Discrepancies</th>
              </tr>
            </thead>
            <tbody>
              {stats.raStats.map((ra, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3">{ra.name}</td>
                  <td className="text-center py-2 px-3">{ra.labsRequired}</td>
                  <td className="text-center py-2 px-3">
                    <span className={`font-semibold ${
                      ra.labsAssigned === ra.labsRequired
                        ? 'text-green-600'
                        : ra.labsAssigned < ra.labsRequired
                        ? 'text-red-600'
                        : 'text-orange-600'
                    }`}>
                      {ra.labsAssigned}
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">{ra.courses.size}</td>
                  <td className="py-2 px-3">
                    {ra.discrepancies.length > 0 ? (
                      <span className="text-red-600 text-xs">
                        {ra.discrepancies.join(', ')}
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slot Utilization */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Slot Utilization (Top 15)</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {stats.slotUtilization.slice(0, 15).map((slot, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{slot.count}</div>
              <div className="text-xs text-gray-600">{slot.slot}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}
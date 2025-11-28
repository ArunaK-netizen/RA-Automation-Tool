'use client'

import { Allocation, SlotMap } from '@/lib/types'
import { calculateStats } from '@/lib/utils'
import { Users, BookOpen, AlertTriangle, TrendingUp, BarChart3, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  allocations: Allocation[]
  unallocatedLabs?: Allocation[]
  slotMap: SlotMap
}

export default function StatsDashboard({ allocations, unallocatedLabs = [], slotMap }: Props) {
  const stats = calculateStats(allocations, unallocatedLabs)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-500" />}
          title="Total RAs"
          value={stats.totalRAs}
          description="Active teaching assistants"
          delay={0}
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-emerald-500" />}
          title="Total Labs"
          value={stats.totalLabs}
          description="Across all courses"
          delay={100}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-violet-500" />}
          title="Avg Labs/RA"
          value={stats.avgLabsPerRA.toFixed(1)}
          description="Target: 4-6 labs"
          delay={200}
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-amber-500" />}
          title="Discrepancies"
          value={stats.totalDiscrepancies}
          description="Requires attention"
          delay={300}
          highlight={stats.totalDiscrepancies > 0}
        />
      </div>

      {/* Charts & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Course Distribution */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Course Distribution
            </h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
              Top 10 Courses
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.courseDistribution.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="course"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--card-foreground)'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.courseDistribution.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.05})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Min/Max Stats */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Allocation Range</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Highest</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.maxLabs}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Assigned to</p>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-[120px]" title={stats.raWithMaxLabs}>
                    {stats.raWithMaxLabs}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Lowest</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.minLabs}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Assigned to</p>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 truncate max-w-[120px]" title={stats.raWithMinLabs}>
                    {stats.raWithMinLabs}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Slot Utilization</h3>
            <div className="flex flex-wrap gap-2">
              {stats.slotUtilization.slice(0, 10).map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-xs font-medium text-muted-foreground">{slot.slot}</span>
                  <span className="text-xs font-bold text-primary">{slot.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RA Details Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold font-display">Detailed Allocation Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground">
                <th className="text-left py-3 px-6 font-medium">RA Name</th>
                <th className="text-center py-3 px-6 font-medium">Required</th>
                <th className="text-center py-3 px-6 font-medium">Assigned</th>
                <th className="text-center py-3 px-6 font-medium">Courses</th>
                <th className="text-left py-3 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stats.raStats.map((ra, idx) => (
                <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-6 font-medium">{ra.name}</td>
                  <td className="text-center py-3 px-6 text-muted-foreground">{ra.labsRequired}</td>
                  <td className="text-center py-3 px-6">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${ra.labsAssigned >= 4 && ra.labsAssigned <= 6
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                      {ra.labsAssigned}
                    </span>
                  </td>
                  <td className="text-center py-3 px-6 text-muted-foreground">{ra.courses.size}</td>
                  <td className="py-3 px-6">
                    {ra.discrepancies.length > 0 ? (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">{ra.discrepancies[0]}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">Optimal</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, description, delay, highlight }: any) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 ${highlight ? 'ring-2 ring-amber-500/50' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-secondary/50 group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        {highlight && (
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      <div>
        <h4 className="text-3xl font-bold font-display tracking-tight mb-1">{value}</h4>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{description}</p>
      </div>
    </div>
  )
}
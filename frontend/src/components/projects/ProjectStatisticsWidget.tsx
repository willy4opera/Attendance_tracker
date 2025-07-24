import React from 'react'
import { useProjectStatistics } from '../../hooks/useProjectStatistics'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export function ProjectStatisticsWidget() {
  const { statistics, loading } = useProjectStatistics()

  if (loading || !statistics) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  const topPerformers = statistics.memberProductivityStats.slice(0, 5)
  const weeklyTrend = statistics.weeklyTrends[0] // Most recent week

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Project Analytics</h3>
      
      {/* Weekly Trend */}
      {weeklyTrend && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">This Week's Activity</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-900">{weeklyTrend.tasks_created}</p>
              <p className="text-xs text-blue-700">Tasks Created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{weeklyTrend.tasks_completed}</p>
              <p className="text-xs text-blue-700">Tasks Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{weeklyTrend.boards_active}</p>
              <p className="text-xs text-blue-700">Active Boards</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{weeklyTrend.completion_rate}%</p>
              <p className="text-xs text-blue-700">Completion Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top Performers</h4>
        <div className="space-y-2">
          {topPerformers.map((member, index) => (
            <div key={member.member_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.member_name}</p>
                  <p className="text-xs text-gray-500">{member.role_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{member.completion_rate}%</p>
                <p className="text-xs text-gray-500">
                  {member.completed_tasks}/{member.total_assigned_tasks} tasks
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

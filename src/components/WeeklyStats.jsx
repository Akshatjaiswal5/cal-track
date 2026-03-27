import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const GOAL = 2200

function getWeekDates(offset = 0) {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function calColor(cals) {
  if (cals === 0) return 'bg-gray-100 text-gray-400'
  if (cals < GOAL * 0.82) return 'bg-green-100 text-green-700'
  if (cals < GOAL) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

function barColor(cals) {
  if (cals === 0) return 'bg-gray-200'
  if (cals < GOAL * 0.82) return 'bg-green-400'
  if (cals < GOAL) return 'bg-yellow-400'
  return 'bg-red-400'
}

const MEAL_META = {
  morning: { icon: '🌅', label: 'Morning' },
  afternoon: { icon: '☀️', label: 'Afternoon' },
  dinner: { icon: '🌙', label: 'Dinner' },
}

export default function WeeklyStats() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [logsByDay, setLogsByDay] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    async function fetchWeek() {
      setLoading(true)
      const start = weekDates[0]
      const end = new Date(weekDates[6])
      end.setDate(end.getDate() + 1)

      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .gte('logged_at', start.toISOString())
        .lt('logged_at', end.toISOString())
        .order('logged_at', { ascending: true })

      const byDay = {}
      weekDates.forEach((d) => {
        const key = d.toISOString().split('T')[0]
        byDay[key] = (data || []).filter((log) =>
          isSameDay(new Date(log.logged_at), d)
        )
      })
      setLogsByDay(byDay)
      setLoading(false)
    }
    fetchWeek()
  }, [weekOffset])

  const today = new Date()
  const totalWeekCals = Object.values(logsByDay).flat().reduce((s, l) => s + (l.calories || 0), 0)
  const activeDays = Object.values(logsByDay).filter((logs) => logs.length > 0).length

  return (
    <div className="px-5 pt-5 pb-6">
      {/* Week nav */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Weekly Stats</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              weekOffset === 0 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            This week
          </button>
          <button
            onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
            disabled={weekOffset === 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Week summary */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-400 font-medium">Total this week</p>
            <p className="text-2xl font-bold text-purple-700 mt-0.5">{totalWeekCals}</p>
            <p className="text-xs text-purple-400">calories</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium">Daily average</p>
            <p className="text-2xl font-bold text-gray-700 mt-0.5">
              {activeDays ? Math.round(totalWeekCals / activeDays) : 0}
            </p>
            <p className="text-xs text-gray-400">over {activeDays} active day{activeDays !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Day grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {weekDates.map((date, i) => {
            const key = date.toISOString().split('T')[0]
            const dayLogs = logsByDay[key] || []
            const cals = dayLogs.reduce((s, l) => s + (l.calories || 0), 0)
            const isToday = isSameDay(date, today)
            const isFuture = date > today && !isToday
            const isOpen = expanded === key

            return (
              <div key={key}>
                <button
                  onClick={() => !isFuture && setExpanded(isOpen ? null : key)}
                  disabled={isFuture}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isToday ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                  } ${isFuture ? 'opacity-40' : 'hover:bg-gray-100 active:scale-[0.99]'}`}
                >
                  {/* Day label */}
                  <div className="w-10 shrink-0 text-left">
                    <p className={`text-xs font-semibold ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                      {DAY_LABELS[i]}
                    </p>
                    <p className={`text-[11px] ${isToday ? 'text-purple-400' : 'text-gray-300'}`}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </p>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    {!isFuture && cals > 0 && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor(cals)}`}
                        style={{ width: `${Math.min((cals / GOAL) * 100, 100)}%` }}
                      />
                    )}
                  </div>

                  {/* Calories */}
                  <div className="w-16 text-right shrink-0">
                    {!isFuture && cals > 0 ? (
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${calColor(cals)}`}>
                        {cals}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">{isFuture ? '' : '–'}</span>
                    )}
                  </div>

                  {!isFuture && dayLogs.length > 0 && (
                    <span className="text-gray-300 text-sm">{isOpen ? '▾' : '›'}</span>
                  )}
                </button>

                {/* Expanded logs */}
                {isOpen && dayLogs.length > 0 && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-purple-100 space-y-1 pb-2">
                    {['morning', 'afternoon', 'dinner'].map((meal) => {
                      const mealLogs = dayLogs.filter((l) => l.meal_type === meal)
                      if (mealLogs.length === 0) return null
                      const meta = MEAL_META[meal]
                      return (
                        <div key={meal} className="py-1">
                          <p className="text-[11px] text-gray-400 font-medium mb-1">
                            {meta.icon} {meta.label}
                          </p>
                          {mealLogs.map((log) => (
                            <div key={log.id} className="flex justify-between items-center py-0.5">
                              <span className="text-xs text-gray-700">{log.subtype || log.food_name}</span>
                              <span className="text-xs font-semibold text-purple-600">{log.calories} cal</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    <div className="flex justify-between pt-1 border-t border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">Total</span>
                      <span className="text-xs font-bold text-purple-700">{cals} cal</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

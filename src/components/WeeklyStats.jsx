import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CAL_GOAL = 2200
const PROTEIN_GOAL = 150

const MEAL_META = {
  morning: { icon: '🌅', label: 'Morning' },
  afternoon: { icon: '☀️', label: 'Afternoon' },
  dinner: { icon: '🌙', label: 'Dinner' },
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toKey(date) {
  return date.toISOString().split('T')[0]
}

function getWeekDates(offset = 0) {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthDates(offset = 0) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  const leadingNulls = (first.getDay() + 6) % 7 // Mon-anchored
  const days = []
  for (let i = 0; i < leadingNulls; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) days.push(null)
  return { days, year, month }
}

function calBg(cals) {
  if (!cals) return 'bg-gray-50'
  if (cals < CAL_GOAL * 0.82) return 'bg-green-100'
  if (cals < CAL_GOAL) return 'bg-yellow-100'
  return 'bg-red-100'
}

function calText(cals) {
  if (!cals) return 'text-gray-300'
  if (cals < CAL_GOAL * 0.82) return 'text-green-700'
  if (cals < CAL_GOAL) return 'text-yellow-700'
  return 'text-red-600'
}

function barColor(cals) {
  if (!cals) return 'bg-gray-200'
  if (cals < CAL_GOAL * 0.82) return 'bg-green-400'
  if (cals < CAL_GOAL) return 'bg-yellow-400'
  return 'bg-red-400'
}

export default function WeeklyStats() {
  const [view, setView] = useState('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [logsByDay, setLogsByDay] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const today = new Date()

  // Fetch data whenever view/offsets change
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let start, end

      if (view === 'week') {
        const dates = getWeekDates(weekOffset)
        start = dates[0]
        end = new Date(dates[6])
        end.setDate(end.getDate() + 1)
      } else {
        const { days } = getMonthDates(monthOffset)
        const realDays = days.filter(Boolean)
        start = realDays[0]
        end = new Date(realDays[realDays.length - 1])
        end.setDate(end.getDate() + 1)
      }

      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .gte('logged_at', start.toISOString())
        .lt('logged_at', end.toISOString())
        .order('logged_at', { ascending: true })

      const byDay = {}
      ;(data || []).forEach((log) => {
        const k = toKey(new Date(log.logged_at))
        byDay[k] = byDay[k] || []
        byDay[k].push(log)
      })
      setLogsByDay(byDay)
      setLoading(false)
    }
    fetchData()
  }, [view, weekOffset, monthOffset])

  // ── WEEK VIEW ──────────────────────────────────────────
  function WeekView() {
    const weekDates = getWeekDates(weekOffset)
    const allLogs = Object.values(logsByDay).flat()
    const totalWeekCals = allLogs.reduce((s, l) => s + (l.calories || 0), 0)
    const totalWeekProtein = allLogs.reduce((s, l) => s + (l.protein || 0), 0)
    const activeDays = Object.values(logsByDay).filter((d) => d.length > 0).length

    return (
      <>
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">‹</button>
            <button onClick={() => setWeekOffset(0)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${weekOffset === 0 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>This week</button>
            <button onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))} disabled={weekOffset === 0} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30">›</button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-400 font-medium">Calories this week</p>
            <p className="text-2xl font-bold text-purple-700">{totalWeekCals}</p>
            <p className="text-xs text-purple-400">avg {activeDays ? Math.round(totalWeekCals / activeDays) : 0}/day</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-emerald-400 font-medium">Protein this week</p>
            <p className="text-2xl font-bold text-emerald-700">{totalWeekProtein}g</p>
            <p className="text-xs text-emerald-400">avg {activeDays ? Math.round(totalWeekProtein / activeDays) : 0}g/day</p>
          </div>
        </div>

        {/* Day rows */}
        <div className="space-y-2">
          {weekDates.map((date, i) => {
            const key = toKey(date)
            const dayLogs = logsByDay[key] || []
            const cals = dayLogs.reduce((s, l) => s + (l.calories || 0), 0)
            const protein = dayLogs.reduce((s, l) => s + (l.protein || 0), 0)
            const isToday = isSameDay(date, today)
            const isFuture = date > today && !isToday
            const isOpen = expanded === key

            return (
              <div key={key}>
                <button
                  onClick={() => !isFuture && setExpanded(isOpen ? null : key)}
                  disabled={isFuture}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isToday ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'} ${isFuture ? 'opacity-40' : 'hover:bg-gray-100'}`}
                >
                  <div className="w-10 shrink-0 text-left">
                    <p className={`text-xs font-semibold ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>{DAY_LABELS[i]}</p>
                    <p className={`text-[11px] ${isToday ? 'text-purple-400' : 'text-gray-300'}`}>{date.getDate()}/{date.getMonth() + 1}</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      {!isFuture && cals > 0 && <div className={`h-full rounded-full ${barColor(cals)}`} style={{ width: `${Math.min((cals / CAL_GOAL) * 100, 100)}%` }} />}
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      {!isFuture && protein > 0 && <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min((protein / PROTEIN_GOAL) * 100, 100)}%` }} />}
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-20">
                    {!isFuture && cals > 0 ? (
                      <>
                        <p className={`text-xs font-bold ${calText(cals)}`}>{cals} cal</p>
                        {protein > 0 && <p className="text-[11px] font-semibold text-emerald-500">{protein}g P</p>}
                      </>
                    ) : (
                      <span className="text-xs text-gray-300">–</span>
                    )}
                  </div>
                  {!isFuture && dayLogs.length > 0 && <span className="text-gray-300 text-sm">{isOpen ? '▾' : '›'}</span>}
                </button>

                {isOpen && dayLogs.length > 0 && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-purple-100 space-y-1 pb-2">
                    {['morning', 'afternoon', 'dinner'].map((meal) => {
                      const mealLogs = dayLogs.filter((l) => l.meal_type === meal)
                      if (!mealLogs.length) return null
                      const meta = MEAL_META[meal]
                      return (
                        <div key={meal} className="py-1">
                          <p className="text-[11px] text-gray-400 font-medium mb-1">{meta.icon} {meta.label}</p>
                          {mealLogs.map((log) => (
                            <div key={log.id} className="flex justify-between items-center py-0.5">
                              <span className="text-xs text-gray-700">{log.subtype || log.food_name}</span>
                              <div className="flex gap-2">
                                <span className="text-xs font-semibold text-purple-600">{log.calories} cal</span>
                                {log.protein > 0 && <span className="text-xs font-semibold text-emerald-500">{log.protein}g</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    <div className="flex justify-between pt-1 border-t border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">Total</span>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-purple-700">{cals} cal</span>
                        {protein > 0 && <span className="text-xs font-bold text-emerald-600">{protein}g P</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // ── MONTH VIEW ─────────────────────────────────────────
  function MonthView() {
    const { days, year, month } = getMonthDates(monthOffset)
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']

    const allLogs = Object.values(logsByDay).flat()
    const activeDays = Object.values(logsByDay).filter((d) => d.length > 0).length
    const totalCals = allLogs.reduce((s, l) => s + (l.calories || 0), 0)
    const totalProtein = allLogs.reduce((s, l) => s + (l.protein || 0), 0)

    return (
      <>
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">‹</button>
            <button onClick={() => setMonthOffset(0)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${monthOffset === 0 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>This month</button>
            <button onClick={() => setMonthOffset((m) => Math.min(m + 1, 0))} disabled={monthOffset === 0} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30">›</button>
          </div>
          <span className="text-sm font-semibold text-gray-600">{MONTH_NAMES[((month % 12) + 12) % 12]} {year + Math.floor(month / 12)}</span>
        </div>

        {/* Monthly summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-400 font-medium">Calories logged</p>
            <p className="text-2xl font-bold text-purple-700">{totalCals}</p>
            <p className="text-xs text-purple-400">over {activeDays} days</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-emerald-400 font-medium">Protein logged</p>
            <p className="text-2xl font-bold text-emerald-700">{totalProtein}g</p>
            <p className="text-xs text-emerald-400">avg {activeDays ? Math.round(totalProtein / activeDays) : 0}g/day</p>
          </div>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />

            const key = toKey(date)
            const dayLogs = logsByDay[key] || []
            const cals = dayLogs.reduce((s, l) => s + (l.calories || 0), 0)
            const protein = dayLogs.reduce((s, l) => s + (l.protein || 0), 0)
            const isToday = isSameDay(date, today)
            const isFuture = date > today && !isToday
            const isOpen = expanded === key

            return (
              <div key={key}>
                <button
                  onClick={() => !isFuture && dayLogs.length > 0 && setExpanded(isOpen ? null : key)}
                  className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center p-0.5 transition-all
                    ${isToday ? 'ring-2 ring-purple-500' : ''}
                    ${isFuture ? 'opacity-30' : ''}
                    ${cals > 0 ? calBg(cals) : 'bg-gray-50'}
                    ${dayLogs.length > 0 && !isFuture ? 'hover:opacity-80 active:scale-95' : ''}
                  `}
                >
                  <span className={`text-[11px] font-bold leading-none mb-0.5 ${isToday ? 'text-purple-600' : cals > 0 ? calText(cals) : 'text-gray-400'}`}>
                    {date.getDate()}
                  </span>
                  {cals > 0 && (
                    <span className={`text-[9px] font-semibold leading-none ${calText(cals)}`}>
                      {cals >= 1000 ? `${(cals / 1000).toFixed(1)}k` : cals}
                    </span>
                  )}
                  {protein > 0 && (
                    <span className="text-[8px] font-semibold leading-none text-emerald-500">
                      {protein}g
                    </span>
                  )}
                </button>

                {/* Expanded detail below the cell */}
                {isOpen && (
                  <div
                    className="col-span-7 mt-1 bg-white border border-purple-100 rounded-xl p-3 shadow-sm z-10"
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    {['morning', 'afternoon', 'dinner'].map((meal) => {
                      const mealLogs = dayLogs.filter((l) => l.meal_type === meal)
                      if (!mealLogs.length) return null
                      return (
                        <div key={meal} className="mb-2">
                          <p className="text-[11px] text-gray-400 mb-1">{MEAL_META[meal].icon} {MEAL_META[meal].label}</p>
                          {mealLogs.map((log) => (
                            <div key={log.id} className="flex justify-between text-xs py-0.5">
                              <span className="text-gray-700">{log.subtype || log.food_name}</span>
                              <div className="flex gap-2">
                                <span className="text-purple-600 font-semibold">{log.calories}</span>
                                {log.protein > 0 && <span className="text-emerald-500 font-semibold">{log.protein}g</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    <div className="flex justify-between pt-1.5 border-t border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">Total</span>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-purple-700">{cals} cal</span>
                        {protein > 0 && <span className="text-xs font-bold text-emerald-600">{protein}g P</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 px-1">
          <span className="text-[10px] text-gray-400">Color:</span>
          {[['bg-green-100', 'Under goal'], ['bg-yellow-100', 'Near goal'], ['bg-red-100', 'Over goal']].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${bg}`} />
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="px-5 pt-5 pb-6">
      {/* Header + tab switcher */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Stats</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['week', 'month'].map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setExpanded(null) }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === v ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : view === 'week' ? <WeekView /> : <MonthView />}
    </div>
  )
}

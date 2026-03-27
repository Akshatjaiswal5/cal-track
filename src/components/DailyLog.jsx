import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import AddFoodLog from './AddFoodLog'

const MEAL_META = {
  morning: { label: 'Morning', icon: '🌅', color: 'text-amber-500', bg: 'bg-amber-50' },
  afternoon: { label: 'Afternoon', icon: '☀️', color: 'text-orange-500', bg: 'bg-orange-50' },
  dinner: { label: 'Dinner', icon: '🌙', color: 'text-indigo-500', bg: 'bg-indigo-50' },
}

export default function DailyLog() {
  const [logs, setLogs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchLogs = useCallback(async () => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: true })

    setLogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const grouped = logs.reduce((acc, log) => {
    const key = log.meal_type || 'dinner'
    acc[key] = acc[key] || []
    acc[key].push(log)
    return acc
  }, {})

  const totalCals = logs.reduce((sum, l) => sum + (l.calories || 0), 0)

  async function deleteLog(id) {
    setDeletingId(id)
    await supabase.from('food_logs').delete().eq('id', id)
    await fetchLogs()
    setDeletingId(null)
  }

  const calColor =
    totalCals < 1800 ? 'text-green-600' : totalCals < 2200 ? 'text-yellow-600' : 'text-red-500'

  return (
    <div className="flex flex-col h-full">
      {/* Daily total */}
      <div className="px-5 pt-5 pb-4">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white shadow-lg shadow-purple-200">
          <p className="text-purple-200 text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{totalCals}</span>
            <span className="text-purple-300 text-sm mb-1">calories today</span>
          </div>
          <div className="mt-3 h-2 bg-purple-500 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalCals / 2200) * 100, 100)}%` }}
            />
          </div>
          <p className="text-purple-300 text-xs mt-1.5">{Math.max(0, 2200 - totalCals)} cal remaining (goal: 2200)</p>
        </div>
      </div>

      {/* Meal groups */}
      <div className="flex-1 px-5 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-medium">Nothing logged yet</p>
            <p className="text-sm mt-1">Tap + to add your first meal</p>
          </div>
        ) : (
          ['morning', 'afternoon', 'dinner'].map((mealType) => {
            const items = grouped[mealType]
            if (!items || items.length === 0) return null
            const meta = MEAL_META[mealType]
            const mealCals = items.reduce((s, l) => s + (l.calories || 0), 0)
            return (
              <div key={mealType}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm ${meta.bg}`}>
                      {meta.icon}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{mealCals} cal</span>
                </div>
                <div className="space-y-2">
                  {items.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{log.subtype || log.food_name}</p>
                        <p className="text-xs text-gray-400">
                          {log.food_name} · ×{log.quantity} · {new Date(log.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm font-bold text-purple-600">{log.calories}</span>
                        <button
                          onClick={() => deleteLog(log.id)}
                          disabled={deletingId === log.id}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none disabled:cursor-not-allowed"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-purple-600 rounded-full shadow-lg shadow-purple-300 flex items-center justify-center text-white text-2xl hover:bg-purple-700 active:scale-95 transition-all z-20"
      >
        +
      </button>

      {showAdd && (
        <AddFoodLog
          onClose={() => setShowAdd(false)}
          onAdded={fetchLogs}
        />
      )}
    </div>
  )
}

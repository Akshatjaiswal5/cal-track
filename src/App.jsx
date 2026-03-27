import { useState } from 'react'
import DailyLog from './components/DailyLog'
import FoodManager from './components/FoodManager'
import WeeklyStats from './components/WeeklyStats'

const tabs = [
  { id: 'today', label: 'Today', icon: '🍽️' },
  { id: 'foods', label: 'Foods', icon: '📋' },
  { id: 'week', label: 'Week', icon: '📅' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('today')

  return (
    <div className="flex flex-col min-h-svh bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
          <span className="text-white text-sm">🥗</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">CalTrack</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'today' && <DailyLog />}
        {activeTab === 'foods' && <FoodManager />}
        {activeTab === 'week' && <WeeklyStats />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative ${
              activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-600 rounded-full" />
            )}
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[11px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

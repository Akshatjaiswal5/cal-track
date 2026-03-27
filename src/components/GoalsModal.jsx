import { useState } from 'react'

export default function GoalsModal({ goals, onSave, onClose }) {
  const [calories, setCalories] = useState(String(goals.calories))
  const [protein, setProtein] = useState(String(goals.protein))

  function handleSave() {
    const cal = parseInt(calories)
    const pro = parseInt(protein)
    if (!cal || !pro) return
    onSave({ calories: cal, protein: pro })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Daily Goals</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-5 space-y-4 pb-8">
          <div className="bg-purple-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-lg">🔥</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Calorie Goal</p>
                <p className="text-xs text-gray-400">Daily target in kcal</p>
              </div>
            </div>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-4 py-3 text-lg font-bold text-purple-700 outline-none focus:border-purple-400 bg-white text-center"
              placeholder="2200"
            />
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">💪</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Protein Goal</p>
                <p className="text-xs text-gray-400">Daily target in grams</p>
              </div>
            </div>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-lg font-bold text-emerald-700 outline-none focus:border-emerald-400 bg-white text-center"
              placeholder="150"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!calories || !protein}
            className="w-full py-3.5 rounded-2xl bg-purple-600 text-white font-semibold text-sm disabled:opacity-40 hover:bg-purple-700 active:scale-[0.98] transition-all"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function getMealType() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'dinner'
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function getSubtype(item, richness) {
  if (!item.subtypes || item.subtypes.length === 0) return item.name
  const subtypes = [...item.subtypes].sort((a, b) => a.threshold - b.threshold)
  for (const st of subtypes) {
    if (richness <= st.threshold) return st.label
  }
  return subtypes[subtypes.length - 1].label
}

export default function AddFoodLog({ onClose, onAdded }) {
  const [foods, setFoods] = useState([])
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [richness, setRichness] = useState(0.5)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('food_items')
      .select('*')
      .order('name')
      .then(({ data }) => setFoods(data || []))
  }, [])

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const calories = selected
    ? lerp(selected.min_calories, selected.max_calories, richness) * quantity
    : 0

  const protein = selected
    ? lerp(selected.min_protein ?? 0, selected.max_protein ?? 0, richness) * quantity
    : 0

  const subtype = selected ? getSubtype(selected, richness) : ''

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase.from('food_logs').insert({
      food_item_id: selected.id,
      food_name: selected.name,
      quantity,
      calories,
      protein,
      subtype,
      meal_type: getMealType(),
      logged_at: new Date().toISOString(),
    })
    setSaving(false)
    if (!error) {
      onAdded()
      onClose()
    }
  }

  const mealType = getMealType()

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Log Food</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Meal tag */}
        <div className="px-5 mb-3">
          <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
            {mealType === 'morning' && '🌅'}
            {mealType === 'afternoon' && '☀️'}
            {mealType === 'dinner' && '🌙'}
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </span>
        </div>

        {/* Search */}
        <div className="px-5 mb-3">
          <input
            type="text"
            placeholder="Search food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto px-5 space-y-2 min-h-0">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">No foods found. Add some in the Foods tab.</p>
          )}
          {filtered.map((food) => (
            <button
              key={food.id}
              onClick={() => { setSelected(food); setQuantity(1); setRichness(0.5) }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                selected?.id === food.id
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              }`}
            >
              <span className="font-medium text-gray-800 text-sm">{food.name}</span>
              <div className="text-right">
                <p className="text-xs text-gray-400">{food.min_calories}–{food.max_calories} cal</p>
                {(food.min_protein > 0 || food.max_protein > 0) && (
                  <p className="text-xs text-emerald-500">{food.min_protein}–{food.max_protein}g P</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Sliders */}
        {selected && (
          <div className="px-5 pt-4 pb-2 border-t border-gray-100 space-y-4">
            {/* Stats preview */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-purple-50 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-purple-600">{calories}</p>
                <p className="text-xs text-purple-400">calories</p>
              </div>
              {(selected.min_protein > 0 || selected.max_protein > 0) && (
                <div className="flex-1 bg-emerald-50 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold text-emerald-600">{protein}g</p>
                  <p className="text-xs text-emerald-400">protein</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-lg font-bold text-gray-600">×{quantity}</p>
                <p className="text-xs text-gray-400">qty</p>
              </div>
            </div>
            <p className="text-xs text-center text-gray-400 -mt-2">{subtype}</p>

            {/* Quantity slider */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Quantity</span>
                <span className="font-semibold text-gray-700">{quantity}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-full"
                style={{ background: `linear-gradient(to right, #9333ea ${((quantity - 0.5) / 4.5) * 100}%, #e5e7eb ${((quantity - 0.5) / 4.5) * 100}%)` }}
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>½</span><span>5</span>
              </div>
            </div>

            {/* Richness slider */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Size / Richness</span>
                <span className="font-semibold text-purple-600">{subtype}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={richness}
                onChange={(e) => setRichness(parseFloat(e.target.value))}
                className="w-full"
                style={{ background: `linear-gradient(to right, #9333ea ${richness * 100}%, #e5e7eb ${richness * 100}%)` }}
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>Small / Light</span><span>Large / Oily</span>
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="px-5 pt-3 pb-6">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full py-3.5 rounded-2xl bg-purple-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 active:scale-[0.98] transition-all"
          >
            {saving ? 'Saving...' : `Log ${selected ? selected.name : 'Food'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

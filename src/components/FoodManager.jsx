import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DEFAULT_SUBTYPES = (name) => [
  { threshold: 0.33, label: `Small ${name}` },
  { threshold: 0.66, label: name },
  { threshold: 1.0, label: `Oily ${name}` },
]

export default function FoodManager() {
  const [foods, setFoods] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    min_calories: '',
    max_calories: '',
    subtypes: [],
  })
  const [subtypeRows, setSubtypeRows] = useState([
    { threshold: 0.33, label: '' },
    { threshold: 0.66, label: '' },
    { threshold: 1.0, label: '' },
  ])

  async function fetchFoods() {
    const { data } = await supabase.from('food_items').select('*').order('name')
    setFoods(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchFoods() }, [])

  function handleNameBlur() {
    if (form.name && subtypeRows.every((r) => !r.label)) {
      const defaults = DEFAULT_SUBTYPES(form.name)
      setSubtypeRows(defaults)
    }
  }

  async function handleSave() {
    if (!form.name || !form.min_calories || !form.max_calories) return
    setSaving(true)
    const subtypes = subtypeRows
      .filter((r) => r.label.trim())
      .map((r) => ({ threshold: parseFloat(r.threshold), label: r.label.trim() }))
    const { error } = await supabase.from('food_items').insert({
      name: form.name.trim(),
      min_calories: parseInt(form.min_calories),
      max_calories: parseInt(form.max_calories),
      subtypes,
    })
    setSaving(false)
    if (!error) {
      setForm({ name: '', min_calories: '', max_calories: '', subtypes: [] })
      setSubtypeRows([{ threshold: 0.33, label: '' }, { threshold: 0.66, label: '' }, { threshold: 1.0, label: '' }])
      setShowForm(false)
      fetchFoods()
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await supabase.from('food_items').delete().eq('id', id)
    await fetchFoods()
    setDeletingId(null)
  }

  return (
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Food Library</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 active:scale-95 transition-all"
        >
          {showForm ? 'Cancel' : '+ Add Food'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-purple-50 rounded-2xl p-4 mb-5 space-y-3 border border-purple-100">
          <h3 className="font-semibold text-gray-800">New Food Item</h3>

          <input
            type="text"
            placeholder="Food name (e.g. Roti)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={handleNameBlur}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 bg-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min calories</label>
              <input
                type="number"
                placeholder="e.g. 60"
                value={form.min_calories}
                onChange={(e) => setForm({ ...form, min_calories: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max calories</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={form.max_calories}
                onChange={(e) => setForm({ ...form, max_calories: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 bg-white"
              />
            </div>
          </div>

          {/* Subtypes */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Subtypes (by richness)</label>
            <div className="space-y-2">
              {subtypeRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16 shrink-0">
                    {i === 0 ? '0–33%' : i === 1 ? '34–66%' : '67–100%'}
                  </span>
                  <input
                    type="text"
                    placeholder={`e.g. ${i === 0 ? 'Small' : i === 1 ? 'Regular' : 'Oily'} ${form.name || 'item'}`}
                    value={row.label}
                    onChange={(e) => {
                      const updated = [...subtypeRows]
                      updated[i] = { ...updated[i], label: e.target.value }
                      setSubtypeRows(updated)
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.min_calories || !form.max_calories}
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm disabled:opacity-40 hover:bg-purple-700 transition-all"
          >
            {saving ? 'Saving...' : 'Save Food'}
          </button>
        </div>
      )}

      {/* Food list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No foods added yet</p>
          <p className="text-sm mt-1">Tap "+ Add Food" to get started</p>
        </div>
      ) : (
        <div className="space-y-2 pb-6">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 group"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">{food.name}</p>
                <p className="text-xs text-gray-400">{food.min_calories}–{food.max_calories} cal each</p>
                {food.subtypes && food.subtypes.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {food.subtypes.map((st, i) => (
                      <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                        {st.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(food.id)}
                disabled={deletingId === food.id}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xl ml-3"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

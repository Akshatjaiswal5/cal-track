import { useState } from 'react'

const DEFAULTS = { calories: 2200, protein: 150 }
const KEY = 'caltrack_goals'

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return saved ? { ...DEFAULTS, ...saved } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function useGoals() {
  const [goals, setGoals] = useState(load)

  function saveGoals(next) {
    setGoals(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return { goals, saveGoals }
}

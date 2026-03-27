import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DEFAULTS = { calories: 2200, protein: 150 }

export function useGoals() {
  const [goals, setGoals] = useState(DEFAULTS)

  useEffect(() => {
    supabase
      .from('user_settings')
      .select('cal_goal, protein_goal')
      .eq('id', 'default')
      .single()
      .then(({ data }) => {
        if (data) setGoals({ calories: data.cal_goal, protein: data.protein_goal })
      })
  }, [])

  async function saveGoals(next) {
    setGoals(next)
    await supabase.from('user_settings').upsert({
      id: 'default',
      cal_goal: next.calories,
      protein_goal: next.protein,
    })
  }

  return { goals, saveGoals }
}

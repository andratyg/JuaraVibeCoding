import { useEffect } from 'react'

export const useEnergyTheme = (energyScore: number | undefined) => {
  useEffect(() => {
    const root = document.documentElement
    if (energyScore === undefined || energyScore === null) {
      root.setAttribute('data-theme', 'purple')
      return
    }
    if (energyScore >= 7) root.setAttribute('data-theme', 'teal')
    else if (energyScore >= 4) root.setAttribute('data-theme', 'purple')
    else root.setAttribute('data-theme', 'amber')
  }, [energyScore])
}

import { useEffect } from 'react';

export const useEnergyTheme = (energyScore: number | null) => {
  useEffect(() => {
    const root = document.documentElement;
    if (!energyScore) { 
      root.setAttribute('data-theme', 'purple'); 
      return; 
    }
    
    if (energyScore >= 7) {
      root.setAttribute('data-theme', 'teal');
    } else if (energyScore >= 4) {
      root.setAttribute('data-theme', 'purple');
    } else {
      root.setAttribute('data-theme', 'amber');
    }
  }, [energyScore]);
};

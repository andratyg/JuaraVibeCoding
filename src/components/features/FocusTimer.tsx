import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Timer, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function FocusTimer({ energyScore }: { energyScore: number }) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Calculate recommended duration based on energy
  const getInitialMinutes = () => {
    if (energyScore >= 8) return 45;
    if (energyScore >= 5) return 25;
    return 15;
  };
  
  const getBreakMinutes = () => {
    if (energyScore >= 8) return 10;
    if (energyScore >= 5) return 5;
    return 5;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialMinutes() * 60);
  
  useEffect(() => {
    // Reset timer when energy score changes and timer is not active
    if (!isActive) {
      setTimeLeft(isBreak ? getBreakMinutes() * 60 : getInitialMinutes() * 60);
    }
  }, [energyScore, isBreak]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.error(e)); // handle browser autoplay restrictions
      
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(getBreakMinutes() * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(getInitialMinutes() * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(getInitialMinutes() * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const progress = isBreak 
    ? 1 - (timeLeft / (getBreakMinutes() * 60))
    : 1 - (timeLeft / (getInitialMinutes() * 60));

  return (
    <Card className="p-6 border border-[var(--border)] bg-[var(--surface)] text-center relative overflow-hidden group">
      <div className="absolute inset-0 z-0 opacity-10 bg-[var(--accent-bg)] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
        
        <div className="flex items-center gap-2 mb-2">
            <Timer size={18} className={isBreak ? 'text-[var(--warning)]' : 'text-[var(--accent)]'} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text2)]">
                {isBreak ? t('tasks.breakTime', 'Break Time') : t('tasks.focusTime', 'Focus Time')}
            </h3>
        </div>

        <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Progress Circle SVG */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="74" fill="none" stroke="var(--border2)" strokeWidth="8" />
                <motion.circle 
                    cx="80" cy="80" r="74" fill="none" 
                    stroke={isBreak ? 'var(--warning)' : 'var(--accent)'} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    strokeDasharray="465"
                    strokeDashoffset={465 * (1 - progress)}
                    animate={{ strokeDashoffset: 465 * (1 - progress) }}
                    transition={{ duration: 1, ease: 'linear' }}
                />
            </svg>
            <div className="text-4xl font-mono font-bold tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
        </div>

        {/* Adaptive Description */}
        <p className="text-[10px] uppercase font-bold text-[var(--text3)] flex items-center justify-center gap-1">
            <Zap size={12} className="text-[var(--accent)]" />
            Adaptive {getInitialMinutes()}m focus based on energy ({energyScore}/10)
        </p>

        <div className="flex items-center gap-3 pt-4">
            <Button onClick={toggleTimer} variant="primary" icon={isActive ? Pause : Play} className="w-24">
                {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={resetTimer} variant="secondary" icon={Square} className="px-4" aria-label="Reset" />
        </div>
      </div>
    </Card>
  );
}

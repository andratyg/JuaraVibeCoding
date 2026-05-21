import { Trophy, Star, Zap, Flame, Target } from 'lucide-react';
import Card from '../ui/Card';
import { useTranslation } from 'react-i18next';

export default function Badges({ streak = 0, completedTasks = 0 }: { streak: number, completedTasks: number }) {
  const { t } = useTranslation();

  const badges = [
    {
      id: 'first_step',
      name: 'First Step',
      desc: 'Completed your first task',
      icon: Target,
      color: 'var(--success)',
      achieved: completedTasks >= 1
    },
    {
      id: 'on_fire',
      name: 'On Fire',
      desc: '3 day streak',
      icon: Flame,
      color: 'var(--warning)',
      achieved: streak >= 3
    },
    {
      id: 'energy_master',
      name: 'Consistent',
      desc: '7 day streak',
      icon: Zap,
      color: 'var(--accent)',
      achieved: streak >= 7
    },
    {
      id: 'task_master',
      name: 'Task Master',
      desc: 'Completed 50 tasks',
      icon: Trophy,
      color: '#F43F5E',
      achieved: completedTasks >= 50
    },
    {
      id: 'flow_state',
      name: 'Flow State',
      desc: 'Completed 100 tasks',
      icon: Star,
      color: '#8B5CF6',
      achieved: completedTasks >= 100
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={20} className="text-[var(--warning)]" />
        <h3 className="font-bold text-lg">Achievements</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {badges.map(badge => (
          <div 
            key={badge.id}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center ${
              badge.achieved 
                ? 'bg-[var(--surface2)] border-[var(--border2)] shadow-sm' 
                : 'bg-transparent border-[var(--border)] opacity-30 grayscale'
            }`}
          >
            <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: badge.achieved ? `${badge.color}20` : 'var(--surface2)', color: badge.achieved ? badge.color : 'var(--text3)' }}
            >
              <badge.icon size={24} />
            </div>
            <p className="font-bold text-xs mb-1">{badge.name}</p>
            <p className="text-[10px] text-[var(--text3)] leading-tight">{badge.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Zap, CheckSquare, Brain, Sparkles, ArrowRight, Activity, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { getSalam, formatDateLong } from '../utils/formatters';
import { fadeInUp, stagger, cardHover } from '../utils/animations';
import { SkeletonPage, SkeletonStatCard } from '../components/ui/Skeletons';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useApp();
  const { data, loading } = useDashboardData(profile?.id);

  if (loading) return <SkeletonPage />;

  const { todayCheckin, tasks = [], streak = 0, completedTasks = 0, totalTasks = 0 } = data || {};
  const energyScore = todayCheckin?.energyScore ?? profile?.energyScore ?? 0;
  const mood = todayCheckin?.mood || 'Netral';

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      {/* Header Section */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t('dashboard.greeting', { salam: getSalam(profile?.displayName) })}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          {formatDateLong(new Date())}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div variants={fadeInUp} {...cardHover}>
          <Card className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              {t('dashboard.energyScore')}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--accent)]">{energyScore}</span>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>/10</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>
              {todayCheckin ? t('checkin.alreadyDone') : t('dashboard.noCheckin')}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} {...cardHover}>
          <Card className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              {t('dashboard.tasksDone')}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--success)]">{completedTasks}</span>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>/ {totalTasks}</span>
            </div>
            <div className="w-full bg-[var(--surface)] h-1 rounded-full mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                className="bg-[var(--success)] h-full"
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} {...cardHover}>
          <Card className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              {t('dashboard.streak')}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-[var(--warning)]">{streak}</span>
              <Activity size={18} className="text-[var(--warning)]" />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>{t('fitness.days')}</p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} {...cardHover}>
          <Card className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              {t('dashboard.moodToday')}
            </p>
            <span className="text-3xl">{todayCheckin?.emoji || '✨'}</span>
            <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text2)' }}>{mood}</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Main Health Card */}
        <div className="lg:col-span-2 space-y-4">
          {!todayCheckin ? (
            <Card accent className="relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Brain size={120} />
              </div>
              <div className="relative z-10 py-2">
                <h3 className="text-xl font-bold mb-2">{t('dashboard.noCheckin')}</h3>
                <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--text2)' }}>
                  Analisis level energi, stres, dan fokus kamu hari ini untuk mendapatkan rekomendasi jadwal kerja yang optimal dari AI.
                </p>
                <Button onClick={() => navigate('/checkin')} icon={Zap}>
                  {t('dashboard.doCheckin')} <Zap size={14} className="ml-1" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--accent)]" />
                  Insight AI
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
                  {todayCheckin.mode}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {todayCheckin.narasi}
              </p>
              <div className="p-3 rounded-lg border border-[var(--border2)] bg-[var(--surface)]">
                <p className="text-[10px] font-bold uppercase text-[var(--accent-text)] mb-1">Tips Hari Ini</p>
                <p className="text-xs font-medium">{todayCheckin.topTip}</p>
              </div>
            </Card>
          )}

          {/* Activity Section */}
          <Card className="space-y-4">
            <h3 className="font-bold">{t('dashboard.recentActivity')}</h3>
            <div className="space-y-3">
              {tasks.length > 0 ? tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface2)] text-[var(--accent-text)]">
                    <CheckSquare size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.name || task.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{task.category || 'Task'} • {task.duration}m</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>{t('common.noData')}</p>
                </div>
              )}
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/tasks')}>
              {t('common.viewAll')}
            </Button>
          </Card>
        </div>

        {/* Quick Actions & Others */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Zap size={18} className="text-[var(--warning)]" />
              {t('dashboard.quickActions')}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="secondary" className="justify-start text-xs h-auto py-3 bg-[var(--surface)]" onClick={() => navigate('/tasks')}>
                <CheckSquare size={16} className="text-[var(--accent)]" />
                {t('tasks.addTask')}
              </Button>
              <Button variant="secondary" className="justify-start text-xs h-auto py-3 bg-[var(--surface)]" onClick={() => navigate('/journal')}>
                <Calendar size={16} className="text-[var(--success)]" />
                {t('journal.title')}
              </Button>
              <Button variant="secondary" className="justify-start text-xs h-auto py-3 bg-[var(--surface)]" onClick={() => navigate('/summarizer')}>
                <FileText size={16} className="text-[var(--warning)]" />
                {t('summarizer.title')}
              </Button>
            </div>
          </Card>

          <Card className="relative overflow-hidden group h-full">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Zap size={120} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                <h4 className="font-bold text-lg leading-tight mb-2">Program Fitness</h4>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>Dapatkan rencana latihan yang disesuaikan dengan energimu hari ini.</p>
              </div>
              <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/fitness')}>
                {t('fitness.generate')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

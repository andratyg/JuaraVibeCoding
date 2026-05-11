import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Zap, CheckSquare, Brain, Sparkles, ArrowRight, 
  Activity, Calendar, FileText, TrendingUp, Trophy 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { getSalam, formatDateLong } from '../utils/formatters';
import { fadeInUp, stagger, itemFadeIn } from '../utils/animations';
import { SkeletonPage } from '../components/ui/Skeletons';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useApp();
  const { data, loading } = useDashboardData(profile?.id);

  if (loading) return <SkeletonPage />;

  const { todayCheckin, tasks = [], streak = 0, completedTasks = 0, totalTasks = 0 } = data || {};
  const energyScore = todayCheckin?.energyScore ?? todayCheckin?.energi ?? 0;
  const mood = todayCheckin?.mood || (todayCheckin ? 'Netral' : t('dashboard.noCheckin'));

  return (
    <motion.div 
      initial="initial" animate="animate" variants={stagger}
      className="space-y-8"
    >
      {/* ── HEADER ── */}
      <motion.header variants={fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-[var(--text)] to-[var(--text2)] bg-clip-text text-transparent">
            {t('dashboard.greeting', { salam: getSalam(profile?.displayName) })}
          </h1>
          <p className="text-sm font-medium opacity-60 uppercase tracking-widest pl-1">
            {formatDateLong(new Date())}
          </p>
        </div>
        {!todayCheckin && (
          <Button onClick={() => navigate('/checkin')} size="lg" icon={Zap} className="shadow-xl shadow-[var(--accent)]/20">
            {t('dashboard.doCheckin')}
          </Button>
        )}
      </motion.header>

      {/* ── BENTO GRID STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={t('dashboard.energyScore')} 
          value={energyScore} 
          maxValue={10} 
          icon={Zap} 
          color="var(--accent)"
          subtext={todayCheckin ? t('checkin.alreadyDone') : t('dashboard.noCheckin')}
        />
        <StatCard 
          label={t('dashboard.tasksDone')} 
          value={completedTasks} 
          maxValue={totalTasks} 
          icon={CheckSquare} 
          color="var(--success)"
          progress
        />
        <StatCard 
          label={t('dashboard.streak')} 
          value={streak} 
          icon={Trophy} 
          color="var(--warning)"
          subtext={t('fitness.days')}
        />
        <StatCard 
          label={t('dashboard.moodToday')} 
          value={todayCheckin?.emoji || '✨'} 
          icon={Activity} 
          color="var(--text)"
          subtext={mood}
          isEmoji
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── INSIGHT / RECOMMENDATION ── */}
        <motion.div variants={fadeInUp} className="lg:col-span-8 space-y-6">
          {todayCheckin ? (
            <Card accent className="relative overflow-hidden group p-8 md:p-10">
              <div className="absolute -right-12 -top-12 opacity-10 blur-2xl w-64 h-64 bg-[var(--accent)] rounded-full group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[var(--accent-bg)] text-[var(--accent)] rounded-xl">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-xl font-bold">Insight AI Hari Ini</h3>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/10 text-white uppercase tracking-widest border border-white/5">
                    {todayCheckin.mode || 'Balance'}
                  </span>
                </div>
                
                <p className="text-lg md:text-xl font-medium leading-relaxed opacity-90 italic">
                  "{todayCheckin.narasi || 'Siap untuk hari yang produktif?'}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-text)] mb-2">Pilar Utama</p>
                    <p className="text-sm font-semibold">{todayCheckin.topTip}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] mb-2">Fokus window</p>
                    <p className="text-sm font-semibold">{todayCheckin.workSlots?.[0] || 'Flexible'}</p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
             <Card className="p-10 flex flex-col items-center text-center space-y-6 bg-[var(--surface2)] border-dashed border-2">
                <div className="p-5 bg-[var(--surface)] rounded-full text-[var(--text3)]">
                   <Brain size={48} className="opacity-20" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-bold">{t('dashboard.noCheckin')}</h3>
                   <p className="text-sm max-w-xs mx-auto opacity-50">Pulse AI butuh data kondisimu untuk memberikan strategi hari ini.</p>
                </div>
                <Button onClick={() => navigate('/checkin')} variant="secondary" icon={ArrowRight}>
                   {t('checkin.startNow')}
                </Button>
             </Card>
          )}

          {/* ── RECENT TASKS ── */}
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--surface)] text-[var(--text2)] rounded-lg">
                  <TrendingUp size={18} />
                </div>
                <h3 className="font-bold">{t('dashboard.recentActivity')}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="text-xs">
                {t('common.viewAll')} <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>

            <div className="space-y-2">
              {tasks.length > 0 ? tasks.slice(0, 4).map((task) => (
                <motion.div 
                  key={task.id} 
                  variants={itemFadeIn}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface2)] text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors">
                    <CheckSquare size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{task.name || task.title}</p>
                    <p className="text-[10px] font-medium opacity-50 uppercase tracking-wider">{task.category || 'General'} • {task.duration}m</p>
                  </div>
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                    task.priority === 'High' ? 'text-[var(--error)] bg-[var(--error-bg)]' : 'text-[var(--text3)] bg-[var(--surface2)]'
                  }`}>
                    {task.priority || 'Med'}
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-dashed">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-30">{t('common.noData')}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── SIDEBAR ACTIONS ── */}
        <motion.div variants={fadeInUp} className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 px-1">{t('dashboard.quickActions')}</h3>
            <div className="grid grid-cols-1 gap-3">
              <ActionButton 
                onClick={() => navigate('/tasks')}
                icon={CheckSquare}
                label={t('tasks.addTask')}
                desc="Tambahkan task baru"
                color="var(--accent)"
              />
              <ActionButton 
                onClick={() => navigate('/journal')}
                icon={Calendar}
                label={t('journal.title')}
                desc="Tulis refleksi harian"
                color="var(--success)"
              />
              <ActionButton 
                onClick={() => navigate('/summarizer')}
                icon={FileText}
                label={t('summarizer.title')}
                desc="Ringkas dokumen panjang"
                color="var(--warning)"
              />
            </div>
          </Card>

          <Card accent className="p-8 relative overflow-hidden group bg-gradient-to-br from-indigo-600 to-violet-700 border-none shadow-2xl">
             <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Dumbbell size={140} className="text-white" />
             </div>
             <div className="relative z-10 space-y-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                   <Dumbbell size={28} />
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-bold text-white leading-tight">Program Fitness AI</h4>
                   <p className="text-xs text-indigo-100">Dapatkan latihan yang disesuaikan dengan level energimu saat ini.</p>
                </div>
                <Button 
                  onClick={() => navigate('/fitness')} 
                  className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-lg"
                >
                  {t('fitness.generate')}
                </Button>
             </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, maxValue, icon: Icon, color, subtext, progress, isEmoji }: any) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 truncate">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`font-bold leading-none ${isEmoji ? 'text-3xl' : 'text-4xl md:text-5xl tracking-tighter'}`} style={{ color }}>
            {value}
          </span>
          {!isEmoji && maxValue !== undefined && (
            <span className="text-xs font-black opacity-20">/ {maxValue}</span>
          )}
        </div>
        {subtext && (
          <p className="text-[10px] font-bold mt-2 truncate opacity-50 uppercase tracking-tighter">{subtext}</p>
        )}
        {progress && maxValue > 0 && (
          <div className="w-full h-1 bg-[var(--surface)] rounded-full mt-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(value / maxValue) * 100}%` }}
              className="h-full"
              style={{ backgroundColor: color }}
            />
          </div>
        )}
      </div>
      <Icon size={16} className="absolute right-4 top-4 opacity-10 group-hover:scale-110 transition-transform" />
    </Card>
  );
}

function ActionButton({ onClick, icon: Icon, label, desc, color }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface2)] transition-all group text-left"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface2)] group-hover:bg-[var(--surface)] shadow-inner transition-colors" style={{ color }}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] font-medium opacity-40 uppercase tracking-tighter">{desc}</p>
      </div>
      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent)]" />
    </button>
  );
}

const Dumbbell = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="M3 21v-2" />
    <path d="M3 5V3" />
    <path d="M21 21v-2" />
    <path d="M21 5V3" />
    <path d="M3 7h1v10H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
    <path d="M21 7h-1v10h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
  </svg>
);

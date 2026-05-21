import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Task } from '../types';
import { 
  Plus, Trash2, Clock, Sparkles, CheckCircle2, 
  Brain, Zap, ArrowRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatters';
import { fadeInUp, itemFadeIn } from '../utils/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SkeletonPage } from '../components/ui/Skeletons';
import FocusTimer from '../components/features/FocusTimer';
import { exportTasksToICS } from '../utils/calendar';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useDashboardData } from '../hooks/useDashboardData';

export default function TaskManager() {
  const { t } = useTranslation();
  const { profile } = useApp();
  const { data: dashboardData } = useDashboardData(profile?.id);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    duration: 30,
    priority: 'Med',
    category: 'Work',
    status: 'To-Do',
    project: '',
    deadline: null,
  });

  const fetchTasks = async () => {
    if (!profile?.id) return;
    try {
      const q = query(collection(db, `users/${profile.id}/tasks`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q).catch(e => {
        if (e.message?.includes('offline')) {
          console.warn('Tasks fetch: client is offline');
          return { docs: [] } as any;
        }
        throw e;
      });
      setTasks(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt?.toDate?.() || new Date(),
          deadline: data.deadline?.toDate?.() || (data.deadline ? new Date(data.deadline) : null),
          startTime: data.startTime?.toDate?.() || (data.startTime ? new Date(data.startTime) : undefined),
          endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : undefined),
        } as Task;
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${profile.id}/tasks`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [profile?.id]);

  const addTask = async () => {
    if (!newTask.title || !profile?.id) return;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const taskData = {
        title: newTask.title,
        duration: newTask.duration,
        priority: newTask.priority,
        category: newTask.category,
        status: 'To-Do',
        completed: false,
        createdAt: Timestamp.now(),
        date: today,
        deadline: newTask.deadline ? Timestamp.fromDate(new Date(newTask.deadline)) : null,
        project: newTask.project || '',
      };
      
      await addDoc(collection(db, `users/${profile.id}/tasks`), taskData);
      setNewTask({ title: '', duration: 30, priority: 'Med', category: 'Work', deadline: null, project: '' });
      toast.success(t('common.success'));
      await fetchTasks();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${profile.id}/tasks`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!profile?.id) return;
    const newStatus = task.status === 'Completed' ? 'To-Do' : 'Completed';
    try {
      await updateDoc(doc(db, `users/${profile.id}/tasks`, task.id), {
        status: newStatus,
        completed: newStatus === 'Completed'
      });
      fetchTasks();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.id}/tasks/${task.id}`);
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    if (!profile?.id) return;
    try {
      await updateDoc(doc(db, `users/${profile.id}/tasks`, id), {
        status,
        completed: status === 'Completed'
      });
      fetchTasks();
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${profile.id}/tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!profile?.id) return;
    try {
      await deleteDoc(doc(db, `users/${profile.id}/tasks`, id));
      toast.success(t('common.done'));
      fetchTasks();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${profile.id}/tasks/${id}`);
    }
  };

  const handleAutoSchedule = async () => {
    if (!profile?.id || tasks.length === 0) return;
    setScheduling(true);
    try {
      const pendingTasks = tasks.filter(t => t.status !== 'Completed');
      const energyScore = dashboardData?.todayCheckin?.energyScore ?? dashboardData?.energyScore ?? profile?.energyScore ?? 5;
      const workSlots = dashboardData?.todayCheckin?.workSlots || ['09:00-12:00', '13:00-17:00'];
      
      const scheduledResult = await geminiService.scheduleTasks(pendingTasks, energyScore, workSlots);
      const scheduled = scheduledResult.schedule || [];
      
      const updates = scheduled.map(async (st: any) => {
        const task = tasks.find(t => t.title === st.taskName);
        if (task && profile) {
          const parseTime = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          };
          await updateDoc(doc(db, `users/${profile.id}/tasks`, task.id), {
            startTime: st.startTime ? Timestamp.fromDate(parseTime(st.startTime)) : null,
            endTime: st.endTime ? Timestamp.fromDate(parseTime(st.endTime)) : null,
          });
        }
      });
      await Promise.all(updates);
      toast.success('Jadwal dioptimalkan oleh AI');
      await fetchTasks();
    } catch (error) {
      console.error(error);
      toast.error('Gagal optimasi jadwal');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) return <SkeletonPage />;

  const pendingCount = tasks.filter(t => t.status !== 'Completed').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  return (
    <motion.div {...fadeInUp} className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('tasks.title')}</h1>
          <p className="text-sm text-[var(--text2)]">{t('tasks.subtitle') || 'Kelola tugas harian Anda dengan sinkronisasi energi AI.'}</p>
        </header>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => {
                exportTasksToICS(tasks.filter(t => t.status !== 'Completed'));
                toast.success('Calendar file downloaded');
            }}
            icon={Calendar}
          >
            Snyc Calendar
          </Button>
          <Button 
            variant="primary" 
            loading={scheduling} 
            onClick={handleAutoSchedule}
            icon={Sparkles}
          >
            {t('tasks.scheduleAI')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={tasks.length} color="var(--accent)" />
        <StatCard label="Pending" value={pendingCount} color="var(--warning)" />
        <StatCard label="Completed" value={completedCount} color="var(--success)" />
        <StatCard label={t('tasks.energyReady')} value={`${(profile?.energyScore || 0) * 10}%`} color="var(--accent)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-lg">{t('tasks.addTask')}</h3>
            <div className="space-y-4">
              <Input
                label={t('tasks.taskName')}
                placeholder={t('tasks.taskNamePlaceholder')}
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('tasks.duration')}
                  type="number"
                  value={newTask.duration}
                  onChange={e => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 0 })}
                />
                <div className="space-y-2">
                   <label className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider">{t('tasks.priority')}</label>
                   <select
                        value={newTask.priority}
                        onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[var(--accent)] transition-all appearance-none"
                   >
                        <option value="Critical">Critical</option>
                        <option value="High">{t('tasks.high')}</option>
                        <option value="Med">{t('tasks.medium')}</option>
                        <option value="Low">{t('tasks.low')}</option>
                   </select>
                </div>
              </div>
              <Button fullWidth loading={isSubmitting} onClick={addTask} icon={Plus}>
                {t('common.add')}
              </Button>
            </div>
          </Card>
          
          <FocusTimer energyScore={profile?.energyScore || 5} />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 border-none bg-indigo-600 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Brain size={100} />
            </div>
            <div className="relative z-10 space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                  <Sparkles size={12} /> Pulse AI Assistant
               </div>
               <p className="text-sm font-medium leading-relaxed">
                  {profile?.energyScore && profile.energyScore > 7 
                    ? t('tasks.aiAdvantageHigh')
                    : profile?.energyScore && profile.energyScore > 4
                    ? t('tasks.aiAdvantageMid')
                    : t('tasks.aiAdvantageLow')}
               </p>
            </div>
          </Card>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div {...itemFadeIn} className="text-center py-20 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] border-dashed opacity-50">
                  <Calendar className="mx-auto mb-4 text-[var(--text3)]" size={32} />
                  <p className="text-sm font-medium">{t('tasks.noTasks')}</p>
                </motion.div>
              ) : (
                tasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={() => toggleTask(task)} 
                        onDelete={() => deleteTask(task.id)}
                        onStatusChange={(s: any) => updateTaskStatus(task.id, s)}
                    />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: any) {
    return (
        <Card className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </Card>
    );
}

function TaskItem({ task, onToggle, onDelete, onStatusChange }: any) {
  const { t } = useTranslation();
  
  const getPriorityColor = (p: string) => {
    switch(p) {
        case 'Critical': return 'text-[var(--danger)] bg-[var(--danger-bg)] border-[var(--danger)]/20';
        case 'High': return 'text-[var(--warning)] bg-[var(--warning-bg)] border-[var(--warning)]/20';
        case 'Med': return 'text-[var(--accent)] bg-[var(--accent-bg)] border-[var(--accent)]/20';
        default: return 'text-[var(--text3)] bg-[var(--surface)] border-[var(--border)]';
    }
  };

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "50px" }}
        exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={cn(
          "p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all group",
          task.status === 'Completed' ? "opacity-50 grayscale" : "hover:border-[var(--accent)]"
      )}>
        <div className="flex items-center gap-4 flex-1">
            <button 
                onClick={onToggle}
                className={cn(
                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    task.status === 'Completed' ? "bg-[var(--success)] border-[var(--success)] text-white" : "border-[var(--border)] hover:border-[var(--accent)]"
                )}
            >
                {task.status === 'Completed' && <CheckCircle2 size={14} />}
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                    <h4 className={cn("text-sm font-bold truncate", task.status === 'Completed' && "line-through")}>{task.title}</h4>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border", getPriorityColor(task.priority))}>
                        {task.priority}
                    </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text3)]">
                        <Clock size={12} /> {task.duration}m
                    </div>
                    {task.startTime && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent)]">
                            <Zap size={12} /> AI Slot: {formatTime(task.startTime)}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-none border-[var(--border)]/50">
           <select
                value={task.status}
                onChange={(e) => onStatusChange(e.target.value as any)}
                className="bg-[var(--surface)] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[var(--border)] px-3 py-2 cursor-pointer focus:outline-none focus:border-[var(--accent)] transition-all"
           >
                <option value="To-Do">TO-DO</option>
                <option value="In Progress">{t('tasks.statusActive').toUpperCase()}</option>
                <option value="Completed">{t('tasks.statusDone').toUpperCase()}</option>
           </select>
           <button onClick={onDelete} className="p-2 text-[var(--text3)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-xl transition-all">
                <Trash2 size={16} />
           </button>
        </div>
      </Card>
    </motion.div>
  );
}

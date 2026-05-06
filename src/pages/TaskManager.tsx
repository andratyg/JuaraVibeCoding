import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Task } from '../types';
import { 
  Plus, Trash2, Calendar, Clock, Loader2, Sparkles, CheckCircle2, 
  Flag, Tag, Folder, RefreshCw, Paperclip, AlertCircle, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatTime, cn, formatDate } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import Tooltip from '../components/Tooltip';

export default function TaskManager() {
  const { t } = useTranslation();
  const { profile } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    duration: 30,
    priority: 'Med',
    category: 'Work',
    status: 'To-Do',
    recurrence: 'None',
    project: '',
    tags: [],
    deadline: null,
  });

  const fetchTasks = async () => {
    if (!profile) return;
    const q = query(collection(db, `users/${profile.id}/tasks`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
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
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [profile]);

  const addTask = async () => {
    if (!newTask.title || !profile) return;
    setLoading(true);
    try {
      await addDoc(collection(db, `users/${profile.id}/tasks`), {
        ...newTask,
        completed: false,
        createdAt: Timestamp.now(),
        deadline: newTask.deadline ? Timestamp.fromDate(new Date(newTask.deadline)) : null,
      });
      setNewTask({ 
        title: '', 
        duration: 30, 
        priority: 'Med', 
        category: 'Work', 
        status: 'To-Do', 
        recurrence: 'None', 
        project: '', 
        tags: [], 
        deadline: null 
      });
      await fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!profile) return;
    const newStatus = task.status === 'Completed' ? 'To-Do' : 'Completed';
    await updateDoc(doc(db, `users/${profile.id}/tasks`, task.id), {
      status: newStatus,
      completed: newStatus === 'Completed'
    });
    fetchTasks();
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    if (!profile) return;
    await updateDoc(doc(db, `users/${profile.id}/tasks`, id), {
      status,
      completed: status === 'Completed'
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!profile) return;
    await deleteDoc(doc(db, `users/${profile.id}/tasks`, id));
    fetchTasks();
  };

  const handleAutoSchedule = async () => {
    if (!profile || tasks.length === 0) return;
    setScheduling(true);
    const pendingTasks = tasks.filter(t => t.status !== 'Completed');
    const scheduled = await geminiService.scheduleTasks(pendingTasks, profile.energyScore, profile.vibeMode);
    
    setTasks(prev => prev.map(t => {
        const s = scheduled.find(st => st.title === t.title);
        if (s) return { ...t, startTime: s.startTime ? new Date(s.startTime) : undefined, endTime: s.endTime ? new Date(s.endTime) : undefined };
        return t;
    }));
    setScheduling(false);
  };

  const getTaskDeadlineInfo = (deadline: Date | null) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff < 0) return { label: 'Overdue', color: 'text-rose-600', icon: AlertCircle };
    if (diff < 24 * 60 * 60 * 1000) return { label: 'Due Today', color: 'text-amber-600', icon: Clock };
    return { label: formatDate(deadline), color: 'text-slate-400', icon: Calendar };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('tasks.title')}</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip content={t('tasks.tooltips.optimize')} />
          <button
            onClick={handleAutoSchedule}
            disabled={scheduling}
            className="bg-[#1a1a2e] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            {scheduling ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {t('tasks.optimize')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Creation Panel */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">{t('tasks.newEntry')}</h3>
              <Folder size={16} className="text-slate-200" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  {t('tasks.titleLabel')}
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                    {t('tasks.durationLabel')}
                    <Tooltip content={t('tasks.tooltips.duration')} />
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={newTask.duration}
                      onChange={e => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                    {t('tasks.priorityLabel')}
                    <Tooltip content={t('tasks.tooltips.priority')} />
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all"
                  >
                    <option value="Critical">{t('tasks.priorities.Critical')}</option>
                    <option value="High">{t('tasks.priorities.High')}</option>
                    <option value="Med">{t('tasks.priorities.Med')}</option>
                    <option value="Low">{t('tasks.priorities.Low')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  {t('tasks.deadlineLabel')}
                  <Tooltip content={t('tasks.tooltips.deadline')} />
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="datetime-local"
                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value ? new Date(e.target.value) : null })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                    {t('tasks.projectLabel')}
                    <Tooltip content={t('tasks.tooltips.project')} />
                  </label>
                  <input
                    type="text"
                    placeholder="Project name"
                    value={newTask.project}
                    onChange={e => setNewTask({ ...newTask, project: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                    {t('tasks.recurrenceLabel')}
                    <Tooltip content={t('tasks.tooltips.recurrence')} />
                  </label>
                  <select
                    value={newTask.recurrence}
                    onChange={e => setNewTask({ ...newTask, recurrence: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all"
                  >
                    <option value="None">{t('tasks.recurrence.None')}</option>
                    <option value="Daily">{t('tasks.recurrence.Daily')}</option>
                    <option value="Weekly">{t('tasks.recurrence.Weekly')}</option>
                    <option value="Monthly">{t('tasks.recurrence.Monthly')}</option>
                  </select>
                </div>
              </div>

              <button
                onClick={addTask}
                disabled={loading}
                className="w-full bg-[var(--primary)] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {t('tasks.addTask')}
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="xl:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
               <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">{t('tasks.activeTimeline')}</h3>
               <div className="flex gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {tasks.filter(t => t.status !== 'Completed').length} Pending
                    </span>
               </div>
            </div>
            
            <div className="p-6 min-h-[600px]">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-center py-40 text-slate-300"
                  >
                    <Calendar className="h-16 w-16 mx-auto mb-6 opacity-5" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">{t('tasks.empty')}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {tasks.sort((a, b) => {
                        const pMap = { Critical: 0, High: 1, Med: 2, Low: 3 };
                        return pMap[a.priority] - pMap[b.priority];
                    }).map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={() => toggleTask(task)}
                        onDelete={() => deleteTask(task.id)}
                        onStatusChange={(s) => updateTaskStatus(task.id, s)}
                        deadlineInfo={getTaskDeadlineInfo(task.deadline)}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onStatusChange: (s: Task['status']) => void;
  deadlineInfo: { label: string; color: string; icon: any } | null;
  key?: any;
}

function TaskItem({ task, onToggle, onDelete, onStatusChange, deadlineInfo }: TaskItemProps) {
    const { t } = useTranslation();
    const StatusIcon = deadlineInfo?.icon || Clock;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative flex items-center gap-5 p-5 rounded-3xl border-2 transition-all duration-300",
                task.status === 'Completed' 
                ? 'bg-slate-50/50 border-transparent opacity-60' 
                : 'bg-white border-slate-50 hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-slate-200/50'
            )}
        >
            <button 
                onClick={onToggle}
                className={cn(
                    "h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                    task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-[var(--primary)]'
                )}
            >
                {task.status === 'Completed' && <CheckCircle2 size={14} />}
            </button>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <h4 className={cn(
                        "text-base font-black truncate transition-all",
                        task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'
                    )}>
                        {task.title}
                    </h4>
                    <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0",
                        task.priority === 'Critical' ? 'bg-rose-100 text-rose-600' :
                        task.priority === 'High' ? 'bg-rose-50 text-rose-500' : 
                        task.priority === 'Med' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'
                    )}>
                        {t(`tasks.priorities.${task.priority}`)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {task.project && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Folder size={12} className="text-slate-300" /> {task.project}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <Clock size={12} className="text-slate-300" /> {task.duration}m
                    </span>
                    {task.recurrence !== 'None' && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400">
                            <RefreshCw size={12} className="animate-spin-slow" /> {t(`tasks.recurrence.${task.recurrence}`)}
                        </span>
                    )}
                    {deadlineInfo && (
                        <span className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider", deadlineInfo.color)}>
                            <StatusIcon size={12} /> {deadlineInfo.label}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(e.target.value as any)}
                    className="hidden md:block bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-2 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-all"
                >
                    <option value="To-Do">{t('tasks.statuses.To-Do')}</option>
                    <option value="In Progress">{t('tasks.statuses.In Progress')}</option>
                    <option value="Blocked">{t('tasks.statuses.Blocked')}</option>
                    <option value="Waiting for Review">{t('tasks.statuses.Waiting for Review')}</option>
                    <option value="Completed">{t('tasks.statuses.Completed')}</option>
                </select>

                <div className="flex items-center">
                    {task.startTime && (
                        <div className="text-right text-[10px] font-black text-[var(--primary)] bg-[var(--primary-light)] px-3 py-2 rounded-xl mr-3">
                            {formatTime(task.startTime)}
                        </div>
                    )}
                    <button 
                        onClick={onDelete}
                        className="p-2.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}


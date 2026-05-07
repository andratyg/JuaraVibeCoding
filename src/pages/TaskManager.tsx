import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../config/firebase';
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
import InfoTooltip from '../components/common/Tooltip';

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
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('tasks.title')}</h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-[0.2em]">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleAutoSchedule}
            disabled={scheduling}
            className="flex-1 md:flex-none bg-[#1a1a2e] text-white px-6 py-4 md:py-3 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 text-[10px] md:text-xs uppercase tracking-widest"
          >
            {scheduling ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {t('tasks.optimize')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
        {/* Creation Panel */}
        <div className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">{t('tasks.newEntry')}</h3>
              <div className="p-2 bg-slate-50 text-slate-300 rounded-xl">
                <Folder size={18} />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Task Heading
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design System Audit"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] px-5 py-4 text-sm font-bold focus:bg-white focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Duration
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="number"
                      value={newTask.duration}
                      onChange={e => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] px-4 py-4 text-sm font-black focus:bg-white focus:border-indigo-600 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Med">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Due Date/Time
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="datetime-local"
                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value ? new Date(e.target.value) : null })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={addTask}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 hover:bg-slate-900 hover:translate-y-[-2px] active:translate-y-[0] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                Add to List
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white shadow-sm rounded-xl border border-slate-100">
                    <Calendar className="text-indigo-600" size={18} />
                  </div>
                  <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">Active Timeline</h3>
               </div>
               <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {tasks.filter(t => t.status !== 'Completed').length} Pending
               </span>
            </div>
            
            <div className="px-8 pt-8">
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-6 relative overflow-hidden">
                  <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                     <Brain size={20} />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">AI Flow Alignment</h4>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        {profile?.energyScore && profile.energyScore > 7 
                          ? "Your energy levels are high. Pursue deep conceptual tasks now for maximum breakthrough potential."
                          : profile?.energyScore && profile.energyScore > 4
                          ? "Steady energy detected. Balanced execution mode is active. Focus on consistent task completion."
                          : "Energy levels are low. Prioritize low-cognitive maintenance tasks or consider a short recharge protocol."}
                     </p>
                  </div>
                  <Zap size={80} className="absolute -right-6 -bottom-6 text-emerald-500/5 rotate-12" />
               </div>
            </div>

            <div className="p-4 md:p-8 min-h-[500px]">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-center py-32 md:py-48"
                  >
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 opacity-40">
                      <Calendar className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{t('tasks.empty')}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4 md:space-y-5">
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
                "group relative flex flex-col md:flex-row md:items-center gap-4 p-5 md:p-6 rounded-[2rem] border-2 transition-all duration-300",
                task.status === 'Completed' 
                ? 'bg-slate-50/50 border-transparent opacity-60' 
                : 'bg-white border-slate-50 hover:border-indigo-600/30 hover:shadow-2xl hover:shadow-indigo-100/50'
            )}
        >
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                    onClick={onToggle}
                    className={cn(
                        "h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                        task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-indigo-600'
                    )}
                >
                    {task.status === 'Completed' && <CheckCircle2 size={12} />}
                </button>
                
                <div className="flex-1 min-w-0 md:hidden">
                    <h4 className={cn(
                        "text-sm font-black truncate transition-all",
                        task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'
                    )}>
                        {task.title}
                    </h4>
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="hidden md:flex items-center gap-3 mb-2">
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
                    {task.status !== 'Completed' && (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                           <Zap size={10} fill="currentColor" /> Alignment: {Math.min(100, (profile?.energyScore || 0) * 10 + 20)}%
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="md:hidden px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">
                        {task.priority}
                    </span>
                    {task.project && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Folder size={12} className="text-slate-300" /> {task.project}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <Clock size={12} className="text-slate-300" /> {task.duration}m
                    </span>
                    {deadlineInfo && (
                        <span className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider", deadlineInfo.color)}>
                            <StatusIcon size={12} /> {deadlineInfo.label}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-50 md:border-none">
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(e.target.value as any)}
                    className="bg-slate-50 border-none rounded-xl text-[9px] font-black uppercase tracking-widest px-3 py-2.5 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-all"
                >
                    <option value="To-Do">TO-DO</option>
                    <option value="In Progress">IN PROGRESS</option>
                    <option value="Completed">COMPLETED</option>
                </select>

                <div className="flex items-center gap-2">
                    {task.startTime && (
                        <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-2.5 rounded-xl">
                            {formatTime(task.startTime)}
                        </div>
                    )}
                    <button 
                        onClick={onDelete}
                        className="p-2.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}


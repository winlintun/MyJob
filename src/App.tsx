import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Target as TargetIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  DollarSign,
  Clock,
  User as UserIcon,
  Menu,
  X,
  Edit2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { User, Job, IncomeRecord, Target } from './types';

// --- Utility Functions ---

// Generate consistent color from job name
const generateColorFromName = (name: string): string => {
  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F43F5E'  // Rose
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return colors[Math.abs(hash) % colors.length];
};

// --- Main App ---

const Card = ({ children, className, title, subtitle }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-2xl border border-zinc-100/50 shadow-sm hover:shadow-md transition-shadow p-6", className)}
  >
    {(title || subtitle) && (
      <div className="mb-6">
        {title && <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>}
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
    )}
    {children}
  </motion.div>
);

const Button = ({ children, onClick, variant = 'primary', className, disabled, type = 'button' }: { children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, disabled?: boolean, type?: 'button' | 'submit' }) => {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100"
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn("px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2", variants[variant], className)}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <input 
      {...props}
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'income' | 'targets' | 'admin'>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const parseResponseBody = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }

    const text = await res.text();
    return text ? { error: text } : null;
  };

  const fetchData = async (userId: number) => {
    try {
      const [jobsRes, incomeRes, targetsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/income'),
        fetch('/api/targets')
      ]);
      setJobs(await jobsRes.json());
      setIncome(await incomeRes.json());
      setTargets(await targetsRes.json());
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await parseResponseBody(res);

      if (res.ok && data) {
        setUser(data);
        setPassword('');
        setAuthError('');
        fetchData(data.id);
      } else {
        if (res.status === 405) {
          setAuthError('Login API is not available in production right now (405). Please redeploy backend service and try again.');
          return;
        }

        if (authMode === 'login') {
          setAuthError((data as any)?.error || 'Invalid username or password. Please re-enter your password and try again.');
          setPassword('');
        } else {
          setAuthError((data as any)?.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Auth request failed:', error);
      setAuthError('Unable to connect to server. Please try again in a moment.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">Income Tracker</h1>
              <p className="text-zinc-500 mt-1">Manage your earnings with precision</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                >
                  {authError}
                </motion.div>
              )}
              <Input 
                label="Username" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full mt-6 bg-linear-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
              <p className="text-sm text-zinc-600 mb-3">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setPassword('');
                }}
                className="text-sm font-semibold text-zinc-900 hover:text-blue-600 transition-colors"
              >
                {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-black/5 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-zinc-900 to-zinc-700 rounded-xl flex items-center justify-center">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg">IncomeTrack</h1>
        </div>
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      </div>

      {/* Sidebar (Mobile Drawer on mobile, collapsible on desktop) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 lg:hidden z-30"
            />
            
            <motion.aside 
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:static left-0 top-0 h-screen lg:h-auto w-64 bg-white border-r border-black/5 p-4 flex flex-col shadow-lg lg:shadow-sm z-40 lg:z-auto overflow-y-auto"
            >
              <div className="hidden lg:flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 bg-linear-to-br from-zinc-900 to-zinc-700 rounded-xl flex items-center justify-center">
                    <Briefcase className="text-white w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">IncomeTrack</span>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                <NavItem 
                  active={activeTab === 'dashboard'} 
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSidebarOpen(false);
                  }} 
                  icon={<LayoutDashboard size={20} />} 
                  label="Dashboard"
                />
                <NavItem 
                  active={activeTab === 'jobs'} 
                  onClick={() => {
                    setActiveTab('jobs');
                    setSidebarOpen(false);
                  }} 
                  icon={<Briefcase size={20} />} 
                  label="Job Profiles"
                />
                <NavItem 
                  active={activeTab === 'income'} 
                  onClick={() => {
                    setActiveTab('income');
                    setSidebarOpen(false);
                  }} 
                  icon={<Calendar size={20} />} 
                  label="Daily Tracking"
                />
                <NavItem 
                  active={activeTab === 'targets'} 
                  onClick={() => {
                    setActiveTab('targets');
                    setSidebarOpen(false);
                  }} 
                  icon={<TargetIcon size={20} />} 
                  label="Income Targets"
                />
                {user.role === 'admin' && (
                  <NavItem 
                    active={activeTab === 'admin'} 
                    onClick={() => {
                      setActiveTab('admin');
                      setSidebarOpen(false);
                    }} 
                    icon={<UserIcon size={20} />} 
                    label="Admin Panel"
                  />
                )}
              </nav>

              <div className="mt-auto pt-4 border-t border-black/5">
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <UserIcon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.username}</p>
                    <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm" 
                  onClick={async () => {
                    await fetch('/api/logout', { method: 'POST' });
                    setUser(null);
                  }}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Dashboard user={user} jobs={jobs} income={income} targets={targets} />
              </motion.div>
            )}
            {activeTab === 'jobs' && (
              <motion.div key="jobs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <JobsView user={user} jobs={jobs} setJobs={setJobs} income={income} setIncome={setIncome} />
              </motion.div>
            )}
            {activeTab === 'income' && (
              <motion.div key="income" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <IncomeView user={user} jobs={jobs} income={income} setIncome={setIncome} />
              </motion.div>
            )}
            {activeTab === 'targets' && (
              <motion.div key="targets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <TargetsView user={user} targets={targets} setTargets={setTargets} income={income} jobs={jobs} />
              </motion.div>
            )}
            {activeTab === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AdminView user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <motion.button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all justify-start",
        active ? "bg-linear-to-r from-zinc-900 to-zinc-800 text-white shadow-lg shadow-zinc-900/20" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

// --- Views ---

function Dashboard({ user, jobs, income, targets }: { user: User, jobs: Job[], income: IncomeRecord[], targets: Target[] }) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const target = targets.find(t => t.month === currentMonth)?.amount || 0;
  
  const monthlyIncome = income
    .filter(i => i.date.startsWith(currentMonth))
    .reduce((sum, i) => sum + i.amount, 0);

  const progress = target > 0 ? Math.min((monthlyIncome / target) * 100, 100) : 0;
  const isExceeded = monthlyIncome > target && target > 0;
  const excessAmount = monthlyIncome - target;

  // Chart Data: Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayIncome = income
      .filter(inc => inc.date === dateStr)
      .reduce((sum, inc) => sum + inc.amount, 0);
    return {
      name: format(d, 'EEE'),
      amount: dayIncome
    };
  });

  // Chart Data: Monthly progress (all days of current month)
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthlyData = daysInMonth.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayIncome = income
      .filter(inc => inc.date === dateStr)
      .reduce((sum, inc) => sum + inc.amount, 0);
    return {
      name: format(day, 'MMM dd'),
      date: dateStr,
      amount: dayIncome
    };
  });

  // Job Distribution
  const jobTotals = jobs.map(job => ({
    name: job.name,
    value: income.filter(i => i.job_id === job.id).reduce((sum, i) => sum + i.amount, 0),
    color: job.color
  })).filter(j => j.value > 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Welcome back, {user.username}</h2>
          <p className="text-zinc-500">Here's how your income is tracking this month.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-black/5 shadow-sm">
          <div className="px-4 py-2">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Current Month</p>
            <p className="text-lg font-bold text-zinc-900">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Monthly Progress</h3>
              <p className="text-sm text-zinc-500">Track your earnings against your target</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-900">NT${monthlyIncome.toLocaleString()}</p>
              <p className="text-sm text-zinc-500">of NT${target.toLocaleString()} goal</p>
            </div>
          </div>
          
          <div className="relative h-4 bg-zinc-100 rounded-full overflow-hidden mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-zinc-900 rounded-full"
            />
          </div>
          
          <div className="flex justify-between text-xs font-medium text-zinc-500 mb-4">
            <span>0%</span>
            <span>{progress.toFixed(1)}% Complete</span>
            <span>100%</span>
          </div>

          {isExceeded && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-emerald-900">Target Exceeded!</p>
                  <p className="text-sm text-emerald-700 mt-1">You've exceeded your target by <span className="font-bold">NT${excessAmount.toLocaleString()}</span></p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-linear-to-r from-emerald-500 to-teal-500"
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{((excessAmount / target) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        <Card className="flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-zinc-500 text-sm font-medium">Daily Average</h3>
          <p className="text-3xl font-bold text-zinc-900 mt-1">
            NT${(monthlyIncome / (new Date().getDate())).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Based on current month activity</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Weekly Activity" subtitle="Income over the last 7 days (Area Chart)">
          <div className="h-75 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Monthly Progress" subtitle="Your earnings this month (Daily breakdown)">
          <div className="h-75 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => `NT$${value.toLocaleString()}`}
                />
                <Area type="monotone" dataKey="amount" fill="#3b82f6" stroke="#3b82f6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Income by Job" subtitle="Distribution of total earnings" className="md:col-span-2">
          <div className="h-75 w-full mt-4 flex items-center justify-center">
            {jobTotals.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobTotals}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {jobTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-zinc-400">
                <p>No income data recorded yet.</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Top Job" subtitle="Your leading income source">
          <div className="flex flex-col justify-center h-75">
            {jobTotals.length > 0 ? (
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: jobTotals[0].color }}
                >
                  <DollarSign />
                </div>
                <p className="text-zinc-500 text-sm">Top Earner</p>
                <p className="text-2xl font-bold text-zinc-900">{jobTotals[0].name}</p>
                <p className="text-lg font-semibold text-emerald-600 mt-2">NT${jobTotals[0].value.toLocaleString()}</p>
                <p className="text-xs text-zinc-400 mt-2">{((jobTotals[0].value / monthlyIncome) * 100).toFixed(1)}% of total</p>
              </div>
            ) : (
              <div className="text-center text-zinc-400">
                <p>No data yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function JobsView({ user, jobs, setJobs, income, setIncome }: { user: User, jobs: Job[], setJobs: React.Dispatch<React.SetStateAction<Job[]>>, income: IncomeRecord[], setIncome: React.Dispatch<React.SetStateAction<IncomeRecord[]>> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newJob, setNewJob] = useState({ name: '', hourly_rate: '', hours_per_day: '', color: '' });

  const handleJobNameChange = (name: string) => {
    setNewJob({
      ...newJob,
      name,
      color: newJob.color || generateColorFromName(name)
    });
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const jobColor = newJob.color || generateColorFromName(newJob.name);
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newJob.name,
        hourly_rate: parseFloat(newJob.hourly_rate),
        hours_per_day: parseFloat(newJob.hours_per_day),
        color: jobColor
      })
    });
    if (res.ok) {
      const job = await res.json();
      setJobs([...jobs, job]);
      setIsAdding(false);
      setNewJob({ name: '', hourly_rate: '', hours_per_day: '', color: '' });
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const jobColor = newJob.color || generateColorFromName(newJob.name);
    const res = await fetch(`/api/jobs/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newJob.name,
        hourly_rate: parseFloat(newJob.hourly_rate),
        hours_per_day: parseFloat(newJob.hours_per_day),
        color: jobColor
      })
    });
    if (res.ok) {
      const updatedJob = await res.json();
      setJobs(jobs.map(j => j.id === editingId ? { ...j, ...updatedJob } : j));
      setEditingId(null);
      setNewJob({ name: '', hourly_rate: '', hours_per_day: '', color: '' });
    }
  };

  const startEditing = (job: Job) => {
    setEditingId(job.id);
    setNewJob({
      name: job.name,
      hourly_rate: job.hourly_rate.toString(),
      hours_per_day: job.hours_per_day.toString(),
      color: job.color
    });
  };

  const deleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job profile? All income records for this job will also be deleted.')) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
        // Remove income entries for this deleted job
        setIncome(income.filter(inc => inc.job_id !== id));
      } else {
        alert('Failed to delete job. Please try again.');
      }
    } catch (error) {
      console.error('Delete job error:', error);
      alert('An error occurred while deleting the job.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Job Profiles</h2>
          <p className="text-zinc-500">Manage your different work sources and rates.</p>
        </div>
        {!editingId && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            Add New Job
          </Button>
        )}
      </div>

      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-8 border-zinc-900/10 bg-zinc-50/50">
              <form onSubmit={editingId ? handleEditJob : handleAddJob} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <Input label="Job Name" placeholder="e.g. Freelance Design" value={newJob.name} onChange={e => handleJobNameChange(e.target.value)} required />
                <Input label="Hourly Rate (NTD)" type="number" step="0.01" placeholder="0.00" value={newJob.hourly_rate} onChange={e => setNewJob({...newJob, hourly_rate: e.target.value})} required />
                <Input label="Hours per Day" type="number" step="0.5" placeholder="8" value={newJob.hours_per_day} onChange={e => setNewJob({...newJob, hours_per_day: e.target.value})} required />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={newJob.color || generateColorFromName(newJob.name)} 
                      onChange={e => setNewJob({...newJob, color: e.target.value})}
                      className="w-12 h-10 border border-zinc-200 rounded-xl cursor-pointer"
                    />
                    <span className="text-xs text-zinc-500">{newJob.color || generateColorFromName(newJob.name)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingId ? 'Update Job' : 'Save Job'}</Button>
                  <Button variant="ghost" onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setNewJob({ name: '', hourly_rate: '', hours_per_day: '', color: '' });
                  }}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.id}>
              <Card className="group hover:border-zinc-900/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: job.color }}>
                    <Briefcase size={20} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditing(job)} className="text-zinc-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteJob(job.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-zinc-900">{job.name}</h4>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Hourly Rate</span>
                    <span className="font-semibold text-zinc-900">NT${job.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Daily Hours</span>
                    <span className="font-semibold text-zinc-900">{job.hours_per_day}h</span>
                  </div>
                  <div className="pt-2 border-t border-black/5 flex justify-between text-sm">
                    <span className="text-zinc-500">Est. Daily Income</span>
                    <span className="font-bold text-emerald-600">NT${(job.hourly_rate * job.hours_per_day).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
          {jobs.length === 0 && !isAdding && !editingId && (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
              <Briefcase className="mx-auto text-zinc-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-zinc-900">No job profiles yet</h3>
              <p className="text-zinc-500">Add your first job to start tracking income.</p>
              <Button variant="secondary" className="mt-4" onClick={() => setIsAdding(true)}>Add Job Now</Button>
            </div>
          )}
        </div>
    </div>
  );
}

function IncomeView({ user, jobs, income, setIncome }: { user: User, jobs: Job[], income: IncomeRecord[], setIncome: React.Dispatch<React.SetStateAction<IncomeRecord[]>> }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJobId, setSelectedJobId] = useState<number | null>(jobs[0]?.id || null);

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) setSelectedJobId(jobs[0].id);
  }, [jobs]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const toggleDay = async (date: Date) => {
    if (!selectedJobId) {
      alert("Please select a job first");
      return;
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return;

    const existing = income.find(i => i.date === dateStr && i.job_id === selectedJobId);
    
    if (existing) {
      // If already exists, we might want to delete it or just leave it. 
      // For this UI, clicking again deletes it (unchecking)
      const res = await fetch(`/api/income/${existing.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIncome(income.filter(i => i.id !== existing.id));
      }
    } else {
      const amount = job.hourly_rate * job.hours_per_day;
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJobId, date: dateStr, amount })
      });
      if (res.ok) {
        const record = await res.json();
        setIncome([...income, { ...record, job_name: job.name }]);
      }
    }
  };

  const getDayIncome = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return income.filter(i => i.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Daily Tracking</h2>
          <p className="text-zinc-500">Mark the days you worked to track your earnings.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-black/5 shadow-sm">
          <Button variant="ghost" className="px-2" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft size={20} />
          </Button>
          <span className="font-bold px-4 min-w-35 text-center">{format(currentDate, 'MMMM yyyy')}</span>
          <Button variant="ghost" className="px-2" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card title="Select Job" subtitle="Which job did you work?">
            <div className="space-y-2">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all border-2",
                    selectedJobId === job.id 
                      ? "text-white border-2 shadow-lg" 
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  )}
                  style={selectedJobId === job.id ? { backgroundColor: job.color, borderColor: job.color } : {}}
                >
                  <span className="truncate">{job.name}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: job.color }}
                    />
                    <span className={cn("text-xs", selectedJobId === job.id ? "text-zinc-400" : "text-zinc-400")}>
                      NT${(job.hourly_rate * job.hours_per_day).toFixed(0)}/day
                    </span>
                  </div>
                </button>
              ))}
              {jobs.length === 0 && (
                <p className="text-xs text-zinc-500 italic">No jobs defined. Go to Job Profiles first.</p>
              )}
            </div>
          </Card>

          <Card title="Month Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-zinc-500">Total Days</span>
                <span className="text-xl font-bold text-zinc-900">
                  {income.filter(i => i.date.startsWith(format(currentDate, 'yyyy-MM'))).length}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-zinc-500">Total Income</span>
                <span className="text-xl font-bold text-emerald-600">
                  NT${income.filter(i => i.date.startsWith(format(currentDate, 'yyyy-MM'))).reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="pt-4 border-t border-zinc-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-500">By Job</span>
                </div>
                <div className="mt-3 space-y-2">
                  {jobs.map(job => {
                    const jobIncome = income
                      .filter(i => i.date.startsWith(format(currentDate, 'yyyy-MM')) && i.job_id === job.id)
                      .reduce((sum, i) => sum + i.amount, 0);
                    return jobIncome > 0 ? (
                      <div key={job.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }} />
                          <span className="text-zinc-600">{job.name}</span>
                        </div>
                        <span className="font-semibold text-zinc-900">NT${jobIncome.toFixed(0)}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-black/5 bg-zinc-50/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {/* Empty cells for padding */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border-r border-b border-black/5 bg-zinc-50/20" />
              ))}
              
              {days.map(day => {
                const dayRecords = getDayIncome(day);
                const isWorked = dayRecords.some(r => r.job_id === selectedJobId);
                const totalDayIncome = dayRecords.reduce((sum, r) => sum + r.amount, 0);
                const primaryJob = dayRecords.length > 0 ? jobs.find(j => j.id === dayRecords[0].job_id) : null;
                const bgColor = primaryJob?.color || '#ffffff';

                return (
                  <button
                    key={day.toString()}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "aspect-square border-r border-b border-black/5 p-2 flex flex-col items-center justify-between transition-all relative group",
                      isToday(day) ? "ring-2 ring-zinc-900 ring-inset" : ""
                    )}
                    style={dayRecords.length > 0 ? { backgroundColor: `${bgColor}20`, borderColor: `${bgColor}40` } : {}}
                  >
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      isToday(day) ? "bg-zinc-900 text-white" : dayRecords.length > 0 ? "text-white font-bold" : "text-zinc-600",
                      dayRecords.length > 0 && !isToday(day) ? "opacity-80" : ""
                    )}
                    style={dayRecords.length > 0 && !isToday(day) ? { backgroundColor: bgColor } : {}}
                    >
                      {format(day, 'd')}
                    </span>
                    
                    <div className="flex flex-wrap justify-center gap-1">
                      {dayRecords.map(r => {
                        const job = jobs.find(j => j.id === r.job_id);
                        return (
                          <div 
                            key={r.id} 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: job?.color || '#18181b' }}
                            title={r.job_name} 
                          />
                        );
                      })}
                    </div>

                    {isWorked && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                        <CheckCircle2 className="text-zinc-900" size={24} />
                      </div>
                    )}

                    {totalDayIncome > 0 && (
                      <span className="text-[10px] font-bold" style={{ color: bgColor }}>
                        NT${totalDayIncome.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
          <p className="mt-4 text-xs text-zinc-500 italic flex items-center gap-1">
            <CheckCircle2 size={14} />
            Click a day to toggle work status for the selected job.
          </p>
        </div>
      </div>
    </div>
  );
}

function TargetsView({ user, targets, setTargets, income, jobs }: { user: User, targets: Target[], setTargets: React.Dispatch<React.SetStateAction<Target[]>>, income: IncomeRecord[], jobs: Job[] }) {
  const [amount, setAmount] = useState('');
  const currentMonth = format(new Date(), 'yyyy-MM');
  const activeTarget = targets.find(t => t.month === currentMonth);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: currentMonth, amount: parseFloat(amount) })
    });
    if (res.ok) {
      const target = await res.json();
      const existingIdx = targets.findIndex(t => t.month === currentMonth);
      if (existingIdx > -1) {
        const newTargets = [...targets];
        newTargets[existingIdx] = target;
        setTargets(newTargets);
      } else {
        setTargets([...targets, target]);
      }
      setAmount('');
    }
  };

  const currentMonthDate = new Date();
  const [chartSlideIndex, setChartSlideIndex] = useState(0);
  
  // Get all months with targets
  const monthsWithTargets = targets.sort((a, b) => b.month.localeCompare(a.month));
  const displayMonth = monthsWithTargets[chartSlideIndex]?.month || currentMonth;
  const displayTarget = targets.find(t => t.month === displayMonth);
  
  // Calculate actual income for display month
  const displayMonthIncome = income
    .filter(i => i.date.startsWith(displayMonth))
    .reduce((sum, i) => sum + i.amount, 0);

  const displayTargetAmount = displayTarget?.amount || 0;
  const displayProgress = displayTargetAmount > 0 ? Math.min((displayMonthIncome / displayTargetAmount) * 100, 100) : 0;

  // Calculate all month completions for Target History
  const monthCompletions = monthsWithTargets.map(t => {
    const monthIncomeTotal = income
      .filter(i => i.date.startsWith(t.month))
      .reduce((sum, i) => sum + i.amount, 0);
    return {
      ...t,
      income: monthIncomeTotal,
      completion: t.amount > 0 ? Math.min((monthIncomeTotal / t.amount) * 100, 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-linear-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">Income Targets</h2>
        <p className="text-zinc-500 mt-2">Visualize your progress with detailed analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Set Target Card */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-zinc-900">Set Monthly Target</h3>
            <p className="text-sm text-zinc-500 mt-1">{format(currentMonthDate, 'MMMM yyyy')}</p>
          </div>
          <form onSubmit={handleSaveTarget} className="space-y-4">
            <Input 
              label="Target Amount (NTD)" 
              type="number" 
              placeholder="e.g. 50000" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required 
            />
            <Button type="submit" className="w-full bg-linear-to-r from-zinc-900 to-zinc-800">Set Target</Button>
          </form>
          
          {activeTarget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-8 border-t border-zinc-100"
            >
              <p className="text-sm text-zinc-500 mb-3">Current Goal</p>
              <p className="text-4xl font-bold text-transparent bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text">NT${activeTarget.amount.toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-2">for {format(parseISO(currentMonth + '-01'), 'MMMM yyyy')}</p>
            </motion.div>
          )}
        </Card>

        {/* Main Analytics Card */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Target Progress</h3>
              <p className="text-sm text-zinc-500 mt-1">Monthly goal tracking</p>
            </div>
            {monthsWithTargets.length > 1 && (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setChartSlideIndex(Math.max(0, chartSlideIndex - 1))}
                  disabled={chartSlideIndex === 0}
                  className="px-3"
                >
                  <ChevronLeft size={18} />
                </Button>
                <span className="text-sm text-zinc-500 min-w-20 text-center">
                  {chartSlideIndex + 1} / {monthsWithTargets.length}
                </span>
                <Button 
                  variant="ghost" 
                  onClick={() => setChartSlideIndex(Math.min(monthsWithTargets.length - 1, chartSlideIndex + 1))}
                  disabled={chartSlideIndex === monthsWithTargets.length - 1}
                  className="px-3"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            )}
          </div>
          
          {displayTarget && (
            <motion.div key={displayMonth} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Target</p>
                    <p className="text-2xl font-bold text-blue-900">NT${displayTargetAmount.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-2">{format(parseISO(displayMonth + '-01'), 'MMMM yyyy')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Achieved</p>
                    <p className="text-2xl font-bold text-emerald-900">NT${displayMonthIncome.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-2">{displayProgress.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-600">Progress</span>
                    <span className="text-sm font-bold text-zinc-900">{displayProgress.toFixed(1)}%</span>
                  </div>
                  <div className="relative h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute top-0 left-0 h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Target History & Analytics */}
      <Card>
        <h3 className="text-lg font-bold text-zinc-900 mb-6">Target History & Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthCompletions.map((t, idx) => {
            const isCompleted = t.completion >= 100;
            const bgGradient = isCompleted 
              ? "from-emerald-50 to-teal-50 border-emerald-200" 
              : "from-zinc-50 to-zinc-100 border-zinc-200";
            
            return (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn("p-4 rounded-xl bg-linear-to-br border hover:shadow-md transition-shadow cursor-pointer", bgGradient)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-zinc-900">{format(parseISO(t.month + '-01'), 'MMM yyyy')}</p>
                    <p className="text-sm text-zinc-500 mt-1">Target Goal</p>
                  </div>
                  {isCompleted && (
                    <div className="bg-emerald-100 text-emerald-700 rounded-full p-2">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
                
                <p className="text-2xl font-bold text-transparent bg-linear-to-r from-zinc-900 to-zinc-700 bg-clip-text mt-2">NT${t.amount.toLocaleString()}</p>
                
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500">Completed</span>
                    <span className={cn("text-xs font-bold", isCompleted ? "text-emerald-600" : "text-zinc-600")}>
                      {t.completion.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(t.completion, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className={cn("h-full transition-all", isCompleted ? "bg-linear-to-r from-emerald-500 to-teal-500" : "bg-linear-to-r from-blue-500 to-cyan-500")}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Earned: NT${t.income.toLocaleString()}</p>
                </div>
              </motion.div>
            );
          })}
          {targets.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-400">
              <TrendingUp className="mx-auto mb-3 opacity-20" size={32} />
              <p className="italic">No targets set yet. Create your first goal above!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminView({ user }: { user: User }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
      });
  }, [user.id]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900">Admin Panel</h2>
        <p className="text-zinc-500">Manage system users and view activity logs.</p>
      </div>

      <Card title="System Users" subtitle="All registered accounts">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5">
                <th className="pb-4 font-bold text-sm text-zinc-400 uppercase tracking-wider">ID</th>
                <th className="pb-4 font-bold text-sm text-zinc-400 uppercase tracking-wider">Username</th>
                <th className="pb-4 font-bold text-sm text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="pb-4 font-bold text-sm text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="py-4 text-sm text-zinc-500">{u.id}</td>
                  <td className="py-4 font-medium text-zinc-900">{u.username}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      u.role === 'admin' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

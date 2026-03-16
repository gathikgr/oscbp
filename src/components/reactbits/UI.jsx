import { motion } from 'framer-motion';

export const RBCard = ({ className = '', children }) => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`glass p-4 ${className}`}>
    {children}
  </motion.div>
);

export const RBButton = ({ children, className = '', ...props }) => (
  <button className={`px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition ${className}`} {...props}>
    {children}
  </button>
);

export const RBInput = ({ className = '', ...props }) => (
  <input className={`w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 ${className}`} {...props} />
);

export const RBTable = ({ headers, rows }) => (
  <div className="overflow-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700">
    <table className="w-full text-sm">
      <thead className="bg-slate-200/60 dark:bg-slate-800">
        <tr>{headers.map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

export const RBAlert = ({ children, variant = 'info' }) => {
  const map = {
    info: 'bg-blue-500/20 border-blue-500',
    success: 'bg-emerald-500/20 border-emerald-500',
    danger: 'bg-rose-500/20 border-rose-500'
  };
  return <div className={`p-3 rounded-lg border ${map[variant]}`}>{children}</div>;
};

export const RBTabs = ({ tabs, active, setActive }) => (
  <div className="flex gap-2 flex-wrap">
    {tabs.map((tab) => (
      <button key={tab} onClick={() => setActive(tab)} className={`px-3 py-1 rounded-lg ${tab === active ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
        {tab}
      </button>
    ))}
  </div>
);

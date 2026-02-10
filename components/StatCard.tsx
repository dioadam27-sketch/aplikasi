import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  // Safe color mapping to ensure Tailwind scans these classes
  const getBgColor = (textColor: string) => {
    if (textColor.includes('blue')) return 'bg-blue-100';
    if (textColor.includes('emerald')) return 'bg-emerald-100';
    if (textColor.includes('orange')) return 'bg-orange-100';
    if (textColor.includes('purple')) return 'bg-purple-100';
    if (textColor.includes('indigo')) return 'bg-indigo-100';
    if (textColor.includes('red')) return 'bg-red-100';
    if (textColor.includes('amber')) return 'bg-amber-100';
    return 'bg-slate-100';
  };

  const bgClass = getBgColor(color);
  
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-opacity-50 ${bgClass} ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
            {trend}
        </div>
      )}
    </div>
  );
};
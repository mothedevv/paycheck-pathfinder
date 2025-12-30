import React from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign } from 'lucide-react';

export default function BillCard({ bill, onEdit }) {
  const daysUntilDue = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

  return (
    <div
      onClick={onEdit}
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">{bill.name}</h3>
          <p className="text-sm text-gray-400 capitalize">{bill.category?.replace('_', ' ')}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">${bill.amount?.toLocaleString()}</p>
          {bill.is_autopay && (
            <p className="text-xs text-lime-400">Autopay</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-gray-300">
            {format(new Date(bill.due_date), 'MMM d, yyyy')}
          </span>
        </div>
        <div>
          {isOverdue && (
            <span className="text-red-400 font-semibold">Overdue</span>
          )}
          {isDueSoon && !isOverdue && (
            <span className="text-orange-400 font-semibold">Due Soon</span>
          )}
          {!isOverdue && !isDueSoon && (
            <span className="text-gray-400">{daysUntilDue} days</span>
          )}
        </div>
      </div>
    </div>
  );
}
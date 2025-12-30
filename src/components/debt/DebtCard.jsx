import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CreditCard } from 'lucide-react';

export default function DebtCard({ debt, onEdit }) {
  const progress = debt.original_balance 
    ? ((debt.original_balance - debt.balance) / debt.original_balance) * 100 
    : 0;

  return (
    <div
      onClick={onEdit}
      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20">
            <CreditCard className="text-red-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">{debt.name}</h3>
            <p className="text-sm text-gray-400 capitalize">{debt.type?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-400">${debt.balance?.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{debt.apr}% APR</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Minimum Payment</span>
          <span className="text-white font-semibold">${debt.minimum_payment?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Due Day</span>
          <span className="text-white">{debt.due_day}th of each month</span>
        </div>
        {debt.original_balance && (
          <div className="pt-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-lime-400">{progress.toFixed(1)}% paid off</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}
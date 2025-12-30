import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { format } from 'date-fns';

export default function SavingsGoalCard({ goal, onEdit }) {
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <div
      onClick={onEdit}
      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-lime-500/20">
            <Target className="text-lime-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">{goal.name}</h3>
            <p className="text-sm text-gray-400">Priority #{goal.priority}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-lime-400">${goal.current_amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-400">of ${goal.target_amount?.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{progress.toFixed(1)}% complete</span>
          <span className="text-white font-semibold">${remaining.toLocaleString()} to go</span>
        </div>
        {goal.target_date && (
          <div className="text-sm text-gray-400">
            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    </div>
  );
}
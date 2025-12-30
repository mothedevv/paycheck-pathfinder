import React from 'react';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function TransactionCard({ transaction, onEdit }) {
  const isIncome = transaction.type === 'income';

  return (
    <div
      onClick={onEdit}
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
            {isIncome ? (
              <ArrowUpCircle className="text-green-400" size={20} />
            ) : (
              <ArrowDownCircle className="text-purple-400" size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{transaction.description}</h3>
            <p className="text-sm text-gray-400 capitalize">{transaction.category?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${isIncome ? 'text-green-400' : 'text-purple-400'}`}>
            {isIncome ? '+' : '-'}${transaction.amount?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{format(new Date(transaction.date), 'MMM d')}</p>
        </div>
      </div>
    </div>
  );
}
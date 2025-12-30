import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import TransactionForm from '@/components/forms/TransactionForm';
import TransactionCard from '@/components/spending/TransactionCard';

export default function Spending() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Transaction.filter({ created_by: currentUser.email }, '-date');
    }
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
    }
  });

  const budget = budgets[0];
  const spendingAllocation = budget ? (budget.monthly_income * (budget.spending_percentage / 100)) : 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySpending = transactions
    .filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0d0d1a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Spending Money</h1>
            <div className="flex items-center gap-2">
              <Wallet className="text-purple-400" size={20} />
              <p className="text-gray-400">
                ${monthlySpending.toLocaleString()} / ${spendingAllocation.toLocaleString()} this month
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="bg-lime-500 text-black font-bold hover:bg-lime-400"
          >
            <Plus size={20} className="mr-2" />
            Add Transaction
          </Button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No transactions yet. Start tracking your spending!</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              Add Your First Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(transaction => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={() => {
                  setEditingTransaction(transaction);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}
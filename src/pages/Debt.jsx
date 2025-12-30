import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, TrendingDown } from 'lucide-react';
import DebtForm from '@/components/forms/DebtForm';
import DebtCard from '@/components/debt/DebtCard';

export default function Debt() {
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const queryClient = useQueryClient();

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Debt.filter({ created_by: currentUser.email });
    }
  });

  const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0d0d1a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Debt Payoff</h1>
            <div className="flex items-center gap-2">
              <TrendingDown className="text-red-400" size={20} />
              <p className="text-gray-400">
                Total: ${totalDebt.toLocaleString()} • Min Payments: ${totalMinPayments.toLocaleString()}/mo
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingDebt(null);
              setShowForm(true);
            }}
            className="bg-lime-500 text-black font-bold hover:bg-lime-400"
          >
            <Plus size={20} className="mr-2" />
            Add Debt
          </Button>
        </div>

        {debts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No debts tracked. Add your debts to start your payoff journey!</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              Add Your First Debt
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map(debt => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onEdit={() => {
                  setEditingDebt(debt);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <DebtForm
          debt={editingDebt}
          onClose={() => {
            setShowForm(false);
            setEditingDebt(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setShowForm(false);
            setEditingDebt(null);
          }}
        />
      )}
    </div>
  );
}
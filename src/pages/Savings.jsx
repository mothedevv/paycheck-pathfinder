import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, PiggyBank } from 'lucide-react';
import SavingsGoalForm from '@/components/forms/SavingsGoalForm';
import SavingsGoalCard from '@/components/savings/SavingsGoalCard';

export default function Savings() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.SavingsGoal.filter({ created_by: currentUser.email }, 'priority');
    }
  });

  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0d0d1a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Savings Goals</h1>
            <div className="flex items-center gap-2">
              <PiggyBank className="text-lime-400" size={20} />
              <p className="text-gray-400">
                ${totalSaved.toLocaleString()} / ${totalTarget.toLocaleString()} saved
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingGoal(null);
              setShowForm(true);
            }}
            className="bg-lime-500 text-black font-bold hover:bg-lime-400"
          >
            <Plus size={20} className="mr-2" />
            Add Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No savings goals yet. Create your first goal!</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <SavingsGoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => {
                  setEditingGoal(goal);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <SavingsGoalForm
          goal={editingGoal}
          onClose={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
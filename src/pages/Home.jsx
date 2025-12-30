import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Settings, Plus, ArrowRight, Receipt, CreditCard, PiggyBank, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import IncomeForm from '@/components/forms/IncomeForm';

const quirkySayings = [
  "Rich people budget. Coincidence? I think not.",
  "Stop being broke. It's embarrassing.",
  "Your budget called. It misses you.",
  "Money talks, but wealth whispers.",
  "Budget like your future self is watching.",
];

export default function Home() {
  const queryClient = useQueryClient();
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const { data: budgets = [], isLoading: budgetLoading } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Bill.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Debt.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.SavingsGoal.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Income.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const budget = budgets[0];
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);

  // Calculate totals
  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalDebts = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalSavingsGoals = savingsGoals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const currentSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const savingsProgress = totalSavingsGoals > 0 ? Math.round((currentSavings / totalSavingsGoals) * 100) : 0;

  // Calculate debt payoff percentage
  const totalOriginalDebt = debts.reduce((sum, d) => sum + (d.original_balance || d.balance || 0), 0);
  const debtProgress = totalOriginalDebt > 0 ? Math.round(((totalOriginalDebt - totalDebts) / totalOriginalDebt) * 100) : 0;

  // Get next payday
  const primaryIncome = incomes.find(i => i.is_primary) || incomes[0];
  const nextPayday = primaryIncome?.next_payday;
  const expectedAmount = primaryIncome?.paycheck_amount || 0;

  if (budgetLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-[#0d0d1a]">
        <OnboardingFlow onComplete={() => queryClient.invalidateQueries({ queryKey: ['userBudget'] })} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black">Your Money Dashboard</h1>
            <p className="text-lime-400 italic text-sm mt-1">"{saying}"</p>
          </div>
          <Link to={createPageUrl('Settings')}>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Settings size={16} />
              Edit Buckets
            </Button>
          </Link>
        </div>

        {/* Track Income Sources Card */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 mt-6">
          <h2 className="text-xl font-bold mb-2">Track Your Income Sources</h2>
          <p className="text-gray-400 text-sm mb-4">
            For households with multiple incomes, add each person's paycheck info here.
          </p>
          <Button
            onClick={() => {
              setEditingIncome(null);
              setShowIncomeForm(true);
            }}
            className="w-full bg-lime-500 text-black font-bold hover:bg-lime-400 h-12 text-base"
          >
            <Plus size={20} className="mr-2" />
            Add Income
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Monthly Bills */}
          <Link to={createPageUrl('Bills')}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Receipt className="text-pink-400" size={20} />
                </div>
                <span className="text-sm text-gray-400">Monthly Bills</span>
              </div>
              <p className="text-2xl font-black mb-1">${totalBills.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{bills.length} bills tracked</p>
            </div>
          </Link>

          {/* Consumer Debt */}
          <Link to={createPageUrl('Debt')}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <CreditCard className="text-purple-400" size={20} />
                </div>
                <span className="text-sm text-gray-400">Consumer Debt</span>
              </div>
              <p className="text-2xl font-black mb-1">${totalDebts.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{debtProgress}% paid off</p>
            </div>
          </Link>

          {/* Savings Goals */}
          <Link to={createPageUrl('Savings')}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-lime-500/20">
                  <PiggyBank className="text-lime-400" size={20} />
                </div>
                <span className="text-sm text-gray-400">Savings Goals</span>
              </div>
              <p className="text-2xl font-black mb-1">${currentSavings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{savingsProgress}% to goals</p>
            </div>
          </Link>

          {/* Next Payday */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Calendar className="text-green-400" size={20} />
              </div>
              <span className="text-sm text-gray-400">Next Payday</span>
            </div>
            <p className="text-2xl font-black mb-1">
              {nextPayday ? new Date(nextPayday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
            </p>
            <p className="text-xs text-gray-500">${expectedAmount.toLocaleString()} expected</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link to={createPageUrl('Bills')}>
            <Button variant="outline" className="w-full h-14 border-white/20 text-white hover:bg-white/10">
              <Plus size={18} className="mr-2" />
              Add Bill
            </Button>
          </Link>
          <Link to={createPageUrl('Debt')}>
            <Button variant="outline" className="w-full h-14 border-white/20 text-white hover:bg-white/10">
              <Plus size={18} className="mr-2" />
              Add Debt
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Link to={createPageUrl('Savings')}>
            <Button variant="outline" className="w-full h-14 border-white/20 text-white hover:bg-white/10">
              <Plus size={18} className="mr-2" />
              Add Goal
            </Button>
          </Link>
          <Button className="w-full h-14 bg-lime-500 text-black font-bold hover:bg-lime-400">
            Plan Payday
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            <Link to={createPageUrl('Home')} className="flex flex-col items-center gap-1">
              <div className="text-lime-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <span className="text-xs text-lime-400 font-semibold">Dashboard</span>
            </Link>

            <Link to={createPageUrl('Bills')} className="flex flex-col items-center gap-1">
              <Receipt className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Bills</span>
            </Link>

            <Link to={createPageUrl('Debt')} className="flex flex-col items-center gap-1">
              <CreditCard className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Debt</span>
            </Link>

            <Link to={createPageUrl('Savings')} className="flex flex-col items-center gap-1">
              <PiggyBank className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Savings</span>
            </Link>

            <Link to={createPageUrl('Payday')} className="flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Payday</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Income Form Modal */}
      {showIncomeForm && (
        <IncomeForm
          income={editingIncome}
          onClose={() => {
            setShowIncomeForm(false);
            setEditingIncome(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            setShowIncomeForm(false);
            setEditingIncome(null);
          }}
        />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, PiggyBank, CreditCard, TrendingUp, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import QuirkySaying from '@/components/ui/QuirkySaying';
import BucketCard from '@/components/budget/BucketCard';
import NetWorthCard from '@/components/budget/NetWorthCard';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import IncomeForm from '@/components/forms/IncomeForm';

export default function Home() {
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchOnWindowFocus: false
  });

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

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Asset.filter({ created_by: currentUser.email });
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

  // Calculate net worth
  const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalDebts = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const netWorth = totalAssets - totalDebts;

  // Calculate upcoming bills (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingBills = bills.filter(bill => {
    if (!bill.due_date) return false;
    const dueDate = new Date(bill.due_date);
    return dueDate >= today && dueDate <= nextWeek;
  });

  const totalUpcoming = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);

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
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-black">Budget Dashboard</h1>
          </div>
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
              <SettingsIcon size={20} />
            </Button>
          </Link>
        </div>
        <QuirkySaying className="text-sm mb-8" />

        {/* Income Sources */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Income Sources</h2>
            <Button 
              onClick={() => {
                setEditingIncome(null);
                setShowIncomeForm(true);
              }}
              size="sm"
              className="bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              + Add Income
            </Button>
          </div>
          
          {incomes.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm">No income sources yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomes.map(income => (
                <div 
                  key={income.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => {
                    setEditingIncome(income);
                    setShowIncomeForm(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{income.name}</p>
                      <p className="text-sm text-gray-400 capitalize">{income.pay_frequency.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-lime-400">${income.paycheck_amount.toLocaleString()}</p>
                      {income.next_payday && (
                        <p className="text-xs text-gray-400">Next: {new Date(income.next_payday).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Monthly Income</p>
                <p className="text-xl font-black text-white">${budget.monthly_income?.toLocaleString() || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CreditCard className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Bills</p>
                <p className="text-xl font-black text-white">{bills.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Calendar className="text-orange-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Due This Week</p>
                <p className="text-xl font-black text-white">${totalUpcoming.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Net Worth</p>
                <p className="text-xl font-black text-white">${netWorth.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Budget Buckets */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Budget Buckets</h2>
          <div className="space-y-4">
            <BucketCard
              name="Bills"
              percentage={budget.bills_percentage || 0}
              amount={(budget.monthly_income || 0) * ((budget.bills_percentage || 0) / 100)}
              color="blue"
              icon={CreditCard}
              link="Bills"
            />
            <BucketCard
              name="Spending Money"
              percentage={budget.spending_percentage || 0}
              amount={(budget.monthly_income || 0) * ((budget.spending_percentage || 0) / 100)}
              color="purple"
              icon={DollarSign}
              link="Spending"
            />
            <BucketCard
              name="Savings & Debt"
              percentage={budget.savings_percentage || 0}
              amount={(budget.monthly_income || 0) * ((budget.savings_percentage || 0) / 100)}
              color="lime"
              icon={PiggyBank}
              link={debts.length > 0 ? "Debt" : "Savings"}
            />
          </div>
        </div>

        {/* Net Worth */}
        <NetWorthCard 
          totalAssets={totalAssets}
          totalDebts={totalDebts}
          netWorth={netWorth}
          assets={assets}
          debts={debts}
        />
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
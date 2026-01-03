import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Settings, Plus, ArrowRight, Receipt, CreditCard, PiggyBank, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import IncomeForm from '@/components/forms/IncomeForm';
import BillForm from '@/components/forms/BillForm';
import DebtForm from '@/components/forms/DebtForm';
import SavingsGoalForm from '@/components/forms/SavingsGoalForm';
import SplashScreen from '@/components/SplashScreen';

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
  const [showBillForm, setShowBillForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const { data: budgets = [], isLoading: budgetLoading, isFetching: budgetFetching } = useQuery({
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

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Asset.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const budget = budgets[0];
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);

  if (budgetLoading || budgetFetching) {
    return <SplashScreen />;
  }

  // Calculate totals
  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalSavingsGoals = savingsGoals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const currentSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const savingsProgress = totalSavingsGoals > 0 ? Math.round((currentSavings / totalSavingsGoals) * 100) : 0;

  // Split debts by type (only show if balance > 0)
  const debtCategories = [
    { 
      type: 'credit_card', 
      label: 'Credit Cards',
      amount: debts.filter(d => d.type === 'credit_card').reduce((sum, d) => sum + (d.balance || 0), 0),
      color: 'purple',
      icon: 'credit-card',
      showAsPercent: false
    },
    { 
      type: 'student_loan', 
      label: 'Student Loans',
      amount: debts.filter(d => d.type === 'student_loan').reduce((sum, d) => sum + (d.balance || 0), 0),
      color: 'blue',
      icon: 'graduation',
      showAsPercent: false
    },
    { 
      type: 'car_loan', 
      label: 'Auto Loans',
      amount: debts.filter(d => d.type === 'car_loan').reduce((sum, d) => sum + (d.balance || 0), 0),
      percentPaid: (() => {
        const carDebts = debts.filter(d => d.type === 'car_loan' && d.balance > 0);
        if (carDebts.length === 0) return 0;
        const totalPaid = carDebts.reduce((sum, d) => {
          const linkedAsset = assets.find(a => a.id === d.linked_asset_id);
          const purchasePrice = linkedAsset?.purchase_price || d.original_balance || d.balance;
          return sum + (purchasePrice - d.balance);
        }, 0);
        const totalOriginal = carDebts.reduce((sum, d) => {
          const linkedAsset = assets.find(a => a.id === d.linked_asset_id);
          return sum + (linkedAsset?.purchase_price || d.original_balance || d.balance);
        }, 0);
        return totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;
      })(),
      color: 'cyan',
      icon: 'car',
      showAsPercent: true
    },
    { 
      type: 'personal_loan', 
      label: 'Personal Loans',
      amount: debts.filter(d => d.type === 'personal_loan').reduce((sum, d) => sum + (d.balance || 0), 0),
      color: 'orange',
      icon: 'document',
      showAsPercent: false
    },
    { 
      type: 'mortgage', 
      label: 'Mortgages',
      amount: debts.filter(d => d.type === 'mortgage').reduce((sum, d) => sum + (d.balance || 0), 0),
      percentPaid: (() => {
        const mortgageDebts = debts.filter(d => d.type === 'mortgage' && d.balance > 0);
        if (mortgageDebts.length === 0) return 0;
        const totalPaid = mortgageDebts.reduce((sum, d) => {
          const linkedAsset = assets.find(a => a.id === d.linked_asset_id);
          const purchasePrice = linkedAsset?.purchase_price || d.original_balance || d.balance;
          return sum + (purchasePrice - d.balance);
        }, 0);
        const totalOriginal = mortgageDebts.reduce((sum, d) => {
          const linkedAsset = assets.find(a => a.id === d.linked_asset_id);
          return sum + (linkedAsset?.purchase_price || d.original_balance || d.balance);
        }, 0);
        return totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;
      })(),
      color: 'red',
      icon: 'home',
      showAsPercent: true
    },
    { 
      type: 'medical', 
      label: 'Medical Debt',
      amount: debts.filter(d => d.type === 'medical').reduce((sum, d) => sum + (d.balance || 0), 0),
      color: 'rose',
      icon: 'medical',
      showAsPercent: false
    }
  ].filter(cat => cat.amount > 0);

  const totalDebtAmount = debtCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Calculate if Next Payday should be full width or half width
  const totalOtherCards = 3 + debtCategories.length; // Bills + Assets + Debt Categories + Savings
  const isNextPaydayFullWidth = totalOtherCards % 2 === 0;

  // Get next payday
  const primaryIncome = incomes.find(i => i.is_primary) || incomes[0];
  const nextPayday = primaryIncome?.next_payday;
  const expectedAmount = primaryIncome?.paycheck_amount || 0;

  if (!budget) {
    return (
      <div className="min-h-screen bg-[#0d0d1a]">
        <OnboardingFlow onComplete={async () => {
        await queryClient.invalidateQueries({ queryKey: ['userBudget'] });
        await queryClient.refetchQueries({ queryKey: ['userBudget'] });
      }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">Your Money Dashboard</h1>
            <p className="text-lime-400 italic text-xs sm:text-sm mt-1">"{saying}"</p>
          </div>
          <Link to={createPageUrl('Settings')}>
            <Button 
              className="bg-[#1a1a2e] border border-white/20 text-white hover:bg-[#252538] flex items-center gap-1 text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4 font-semibold"
            >
              <Settings size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Edit Buckets</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </Link>
        </div>

        {/* Income Sources Section */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold">Your Income Sources</h2>
            <Button
              onClick={() => {
                setEditingIncome(null);
                setShowIncomeForm(true);
              }}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400 h-9 text-sm px-3"
            >
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </div>

          {incomes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-xs sm:text-sm mb-3">
                For households with multiple incomes, add each person's paycheck info here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomes.map(income => (
                <div
                  key={income.id}
                  onClick={() => {
                    setEditingIncome(income);
                    setShowIncomeForm(true);
                  }}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        {income.name}
                        {income.is_primary && (
                          <span className="text-xs bg-lime-500/20 text-lime-400 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {income.pay_frequency.replace('_', '-')} • ${income.paycheck_amount.toLocaleString()}/check
                      </p>
                    </div>
                    {income.next_payday && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Next</p>
                        <p className="text-sm font-semibold text-lime-400">
                          {(() => {
                            const [y, m, d] = income.next_payday.split('-').map(Number);
                            const date = new Date(y, m - 1, d);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
          {/* Monthly Bills */}
          <Link to={createPageUrl('Bills')}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-pink-500/20 mb-2">
                  <Receipt className="text-pink-400" size={16} />
                </div>
                <span className="text-xs sm:text-sm text-gray-400 mb-2">Monthly Bills</span>
                <p className="text-xl sm:text-2xl font-black mb-1">${totalBills.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{bills.length} bills</p>
              </div>
            </div>
          </Link>

          {/* Assets */}
          <Link to={createPageUrl('Debt')}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 mb-2">
                  <svg className="text-emerald-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-gray-400 mb-2">Assets</span>
                <p className="text-xl sm:text-2xl font-black mb-1">${totalAssets.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{assets.length} tracked</p>
              </div>
            </div>
          </Link>

          {/* Dynamic Debt Categories */}
          {debtCategories.map(category => {
            const colorClasses = {
              purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
              blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
              cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
              orange: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
              red: { bg: 'bg-red-500/20', text: 'text-red-400' },
              rose: { bg: 'bg-rose-500/20', text: 'text-rose-400' }
            };

            const icons = {
              'credit-card': <CreditCard className={colorClasses[category.color].text} size={16} />,
              'graduation': <svg className={colorClasses[category.color].text} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>,
              'car': <svg className={colorClasses[category.color].text} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>,
              'document': <svg className={colorClasses[category.color].text} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>,
              'home': <svg className={colorClasses[category.color].text} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>,
              'medical': <svg className={colorClasses[category.color].text} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            };

            return (
              <Link key={category.type} to={createPageUrl('Debt')}>
                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:bg-[#252538] transition-colors cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${colorClasses[category.color].bg} mb-2`}>
                      {icons[category.icon]}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400 mb-2">{category.label}</span>
                    <p className="text-xl sm:text-2xl font-black mb-1">${category.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {category.showAsPercent ? `${category.percentPaid}% paid off` : 'debt'}
                    </p>
                  </div>
                </div>
              </Link>
            );
            })}

          {/* Savings Goals */}
          <Link to={createPageUrl('Savings')}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-lime-500/20 mb-2">
                  <PiggyBank className="text-lime-400" size={16} />
                </div>
                <span className="text-xs sm:text-sm text-gray-400 mb-2">Savings Goals</span>
                <p className="text-xl sm:text-2xl font-black mb-1">${currentSavings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{savingsProgress}% to goals</p>
              </div>
            </div>
          </Link>

          {/* Next Payday - flexible width */}
          <div className={isNextPaydayFullWidth ? "col-span-2" : ""}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:bg-[#252538] transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 mb-2">
                  <Calendar className="text-green-400" size={16} />
                </div>
                <span className="text-xs sm:text-sm text-gray-400 mb-2">Next Payday</span>
                <p className="text-xl sm:text-2xl font-black mb-1">
                  {nextPayday ? (() => {
                    const [y, m, d] = nextPayday.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  })() : 'Not set'}
                </p>
                <p className="text-xs text-gray-500">${expectedAmount.toLocaleString()}</p>
                {isNextPaydayFullWidth && primaryIncome && (
                  <div className="mt-3 pt-3 border-t border-white/10 w-full flex justify-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Income Source</p>
                      <p className="text-sm font-semibold text-white">{primaryIncome.name}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Frequency</p>
                      <p className="text-sm font-semibold text-white capitalize">{payFrequency.replace('_', '-')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <Button 
            onClick={() => setShowBillForm(true)}
            className="w-full h-12 sm:h-14 bg-[#1a1a2e] border border-white/20 text-white hover:bg-[#252538] text-sm sm:text-base font-semibold"
          >
            <Plus size={16} className="mr-1 sm:mr-2" />
            Add Bill
          </Button>
          <Button 
            onClick={() => setShowDebtForm(true)}
            className="w-full h-12 sm:h-14 bg-[#1a1a2e] border border-white/20 text-white hover:bg-[#252538] text-sm sm:text-base font-semibold"
          >
            <Plus size={16} className="mr-1 sm:mr-2" />
            Add Debt
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
          <Button 
            onClick={() => setShowGoalForm(true)}
            className="w-full h-12 sm:h-14 bg-[#1a1a2e] border border-white/20 text-white hover:bg-[#252538] text-sm sm:text-base font-semibold"
          >
            <Plus size={16} className="mr-1 sm:mr-2" />
            Add Goal
          </Button>
          <Link to={createPageUrl('Payday')}>
            <Button className="w-full h-12 sm:h-14 bg-lime-500 text-black font-bold hover:bg-lime-400 text-sm sm:text-base">
              Plan Payday
              <ArrowRight size={16} className="ml-1 sm:ml-2" />
            </Button>
          </Link>
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

      {/* Forms */}
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

      {showBillForm && (
        <BillForm
          onClose={() => setShowBillForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            setShowBillForm(false);
          }}
        />
      )}

      {showDebtForm && (
        <DebtForm
          onClose={() => setShowDebtForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setShowDebtForm(false);
          }}
        />
      )}

      {showGoalForm && (
        <SavingsGoalForm
          onClose={() => setShowGoalForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
            setShowGoalForm(false);
          }}
        />
      )}
      </div>
      );
}
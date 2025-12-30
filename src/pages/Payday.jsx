import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Receipt, Sparkles, Plus, CheckCircle, CreditCard, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BillForm from '@/components/forms/BillForm';
import DebtForm from '@/components/forms/DebtForm';
import SavingsGoalForm from '@/components/forms/SavingsGoalForm';
import OneTimeDepositForm from '@/components/forms/OneTimeDepositForm';

const quirkySayings = [
  "Stop treating your savings like an emergency fund for brunch.",
  "Your paycheck has a purpose. Give it one.",
  "Budget like you mean it.",
  "Every dollar needs a job.",
];

export default function Payday() {
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: budgets = [] } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
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

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Bill.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const { data: oneTimeDeposits = [] } = useQuery({
    queryKey: ['oneTimeDeposits'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.OneTimeDeposit.filter({ created_by: currentUser.email, received: false });
    },
    refetchOnWindowFocus: false
  });

  const budget = budgets[0];
  const primaryIncome = incomes.find(i => i.is_primary) || incomes[0];
  const nextPayday = primaryIncome?.next_payday;
  const paycheckAmount = primaryIncome?.paycheck_amount || 0;
  const payFrequency = primaryIncome?.pay_frequency || 'biweekly';

  // Calculate bucket allocations
  const billsAmount = budget ? (paycheckAmount * (budget.bills_percentage / 100)) : 0;
  const spendingAmount = budget ? (paycheckAmount * (budget.spending_percentage / 100)) : 0;
  const savingsAmount = budget ? (paycheckAmount * (budget.savings_percentage / 100)) : 0;

  // Calculate bills due this paycheck (use local timezone)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const paydayDate = nextPayday ? (() => {
    const [year, month, day] = nextPayday.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(23, 59, 59, 999);
    return date;
  })() : today;
  
  const billsDueNow = bills.filter(bill => {
    if (!bill.due_date) return false;
    const [year, month, day] = bill.due_date.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    return dueDate >= today && dueDate <= paydayDate;
  });

  // Calculate total unallocated for future bills
  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalAllocated = bills.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
  const totalUnallocated = totalBills - totalAllocated;

  const hasHYSA = budget?.has_hysa || false;

  // Handle marking payday complete
  const handleMarkComplete = async () => {
    if (!primaryIncome || !paydayDate) return;
    if (!confirm('Mark this payday as complete? This will record allocations and update your next payday date.')) return;

    setIsCompleting(true);
    try {
      // Create payday history record
      const billsAllocatedData = billsDueNow.map(bill => ({
        bill_name: bill.name,
        amount_due: bill.amount,
        amount_allocated: bill.amount,
        due_date: bill.due_date,
        was_autopay: bill.is_autopay
      }));

      const [y, m, d] = nextPayday.split('-').map(Number);
      const localPaydayDate = new Date(y, m - 1, d);
      const paydayDateStr = `${localPaydayDate.getFullYear()}-${String(localPaydayDate.getMonth() + 1).padStart(2, '0')}-${String(localPaydayDate.getDate()).padStart(2, '0')}`;

      await base44.entities.PaydayHistory.create({
        payday_date: paydayDateStr,
        paycheck_amount: paycheckAmount,
        bills_amount: billsAmount,
        spending_amount: spendingAmount,
        savings_amount: savingsAmount,
        bills_allocated: billsAllocatedData,
        debts_allocated: [],
        savings_goals_allocated: [],
        bills_unallocated: 0,
        savings_unallocated: 0
      });

      // Update each bill's allocated amount
      for (const bill of billsDueNow) {
        await base44.entities.Bill.update(bill.id, {
          allocated_amount: (bill.allocated_amount || 0) + bill.amount,
          last_allocated_date: paydayDateStr
        });
      }

      // Calculate next payday based on frequency (using local timezone)
      const [year, month, day] = nextPayday.split('-').map(Number);
      const nextPaydayDate = new Date(year, month - 1, day);
      const frequency = primaryIncome.pay_frequency;

      if (frequency === 'weekly') {
        nextPaydayDate.setDate(nextPaydayDate.getDate() + 7);
      } else if (frequency === 'biweekly') {
        nextPaydayDate.setDate(nextPaydayDate.getDate() + 14);
      } else if (frequency === 'semimonthly') {
        nextPaydayDate.setDate(nextPaydayDate.getDate() + 15);
      } else if (frequency === 'monthly') {
        nextPaydayDate.setMonth(nextPaydayDate.getMonth() + 1);
      }

      // Update income with next payday (format in local timezone)
      const yyyy = nextPaydayDate.getFullYear();
      const mm = String(nextPaydayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextPaydayDate.getDate()).padStart(2, '0');

      await base44.entities.Income.update(primaryIncome.id, {
        next_payday: `${yyyy}-${mm}-${dd}`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      
      alert('Payday marked complete! Next payday updated.');
    } catch (error) {
      console.error('Error marking payday complete:', error);
      alert('Error completing payday. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              Payday<br />Planner
            </h1>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-9 sm:h-10 text-sm sm:text-base px-3 sm:px-4">
            History
          </Button>
        </div>
        <p className="text-lime-400 italic text-xs sm:text-sm ml-11 sm:ml-14">"{saying}"</p>

        {/* Payday Card */}
        <div className="mt-4 sm:mt-6 bg-gradient-to-br from-[#2d3a1f] to-[#1a2312] border border-lime-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 text-lime-400 text-xs sm:text-sm mb-2">
            <Calendar size={14} />
            <span>{payFrequency.replace('_', '-')} pay</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">
            {nextPayday ? new Date(nextPayday).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'No payday set'}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-2">Expected Amount</p>
          <p className="text-4xl sm:text-5xl font-black text-lime-400 mb-4 sm:mb-6">${paycheckAmount.toLocaleString()}</p>

          {/* Budget Allocations */}
          <div className="space-y-2 sm:space-y-3">
            {/* Bills Bucket */}
            <div className="bg-gradient-to-br from-pink-900/40 to-pink-950/30 border border-pink-500/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-pink-500/20">
                  <Receipt className="text-pink-400" size={16} />
                </div>
                <span className="text-pink-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">Bills</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mb-2">${billsAmount.toFixed(2)}</p>
              <p className="text-pink-300 text-xs sm:text-sm flex items-center gap-1">
                → Transfer to HYSA
              </p>
            </div>

            {/* Spending Bucket */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/30 border border-purple-500/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20">
                  <CreditCard className="text-purple-400" size={16} />
                </div>
                <span className="text-purple-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">Spending</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mb-2">${spendingAmount.toFixed(2)}</p>
              <p className="text-purple-300 text-xs sm:text-sm flex items-center gap-1">
                → Keep in Checking
              </p>
            </div>

            {/* Savings Bucket */}
            <div className="bg-gradient-to-br from-lime-900/40 to-lime-950/30 border border-lime-500/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-lime-500/20">
                  <PiggyBank className="text-lime-400" size={16} />
                </div>
                <span className="text-lime-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">Savings</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mb-2">${savingsAmount.toFixed(2)}</p>
              <p className="text-lime-300 text-xs sm:text-sm flex items-center gap-1">
                → Transfer to HYSA
              </p>
            </div>
          </div>
        </div>

        {/* HYSA Warning */}
        {!hasHYSA && (
          <div className="mt-6 bg-gradient-to-r from-amber-900/20 to-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-amber-400 mt-0.5 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">Don't have a HYSA yet?</h3>
              <p className="text-sm text-gray-300">
                Your bills and savings should sit in a high-yield account. Stop losing money.
              </p>
            </div>
            <a 
              href="https://www.fool.com/money/banks/landing/best-high-yield-savings-accounts/?advertisingadgroupid=168782235003&advertisingadgroupname=ta-bank-co-adw-na-savings-5-troas-broad&advertisingcampaignid=21829166860&campaign_group=662651367332&gad_campaignid=21829166860&gad_source=1&gbraid=0AAAAAC-fZv4PHmXsgSby5G5DMe_FvqN7y&gclid=Cj0KCQiA6sjKBhCSARIsAJvYcpPCyCAizq-KvIuyxsgqPaeyqxxfJpGO3JBffRSxNSSUO4Xs2B-uOcgaAorrEALw_wcB&publisher=ta-bank-co-adw-na-savings-5-troas-broad&utm_medium=cpc&utm_source=google&testId=ta-bank-hysa&cellId=1&campaign=the-ascent&source_system_name=fool_splitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" className="text-amber-400 hover:bg-amber-500/10 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </a>
          </div>
        )}

        {/* Pay These Bills Now */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-pink-400">$</span>
            Pay These Bills Now
          </h3>
          {billsDueNow.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center">
              <CheckCircle className="text-lime-500 mb-3" size={48} />
              <p className="text-gray-400 text-center">No bills due this check!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billsDueNow.map(bill => (
                <div key={bill.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{bill.name}</h4>
                      <p className="text-sm text-gray-400">
                        Due: {new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {bill.is_autopay && <span className="ml-2 text-lime-400">• Auto-pay</span>}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-pink-400">${bill.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Unallocated */}
        <div className="mt-6 bg-gradient-to-br from-lime-900/20 to-lime-950/10 border border-lime-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Total Unallocated (Future Bills)</p>
              <p className="text-xs text-gray-500">Stays in HYSA for upcoming bills</p>
            </div>
            <p className="text-3xl font-black text-lime-400">${totalUnallocated.toFixed(2)}</p>
          </div>
        </div>

        {/* One-Time Deposits */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-amber-400" size={20} />
              One-Time Deposits
            </h3>
            <Button 
              onClick={() => setShowDepositForm(true)}
              className="bg-amber-500 text-black font-bold hover:bg-amber-400 h-9"
            >
              <Plus size={16} className="mr-1" />
              Add Deposit
            </Button>
          </div>
          
          {oneTimeDeposits.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center">
              <div className="text-6xl text-gray-700 mb-3">$</div>
              <p className="text-gray-400 text-center text-sm">
                Track one-time deposits like tax returns, bonuses, or school disbursements
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {oneTimeDeposits.map(deposit => (
                <div key={deposit.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{deposit.name}</h4>
                      <p className="text-sm text-gray-400">
                        Expected: {new Date(deposit.expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-lime-400">${deposit.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mark Complete Button */}
        <div className="mt-6 sm:mt-8">
          <Button 
            onClick={handleMarkComplete}
            disabled={isCompleting || !nextPayday}
            className="w-full bg-lime-500 text-black font-bold hover:bg-lime-400 h-12 sm:h-14 text-base sm:text-lg disabled:opacity-50"
          >
            <CheckCircle size={18} className="mr-2" />
            {isCompleting ? 'Processing...' : 'Mark Payday Complete'}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            <Link to={createPageUrl('Home')} className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-xs text-gray-400">Dashboard</span>
            </Link>

            <Link to={createPageUrl('Bills')} className="flex flex-col items-center gap-1">
              <Receipt className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Bills</span>
            </Link>

            <Link to={createPageUrl('Debt')} className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                <path d="M2 10h20" strokeWidth="2" />
              </svg>
              <span className="text-xs text-gray-400">Debt</span>
            </Link>

            <Link to={createPageUrl('Savings')} className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs text-gray-400">Savings</span>
            </Link>

            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6 text-lime-400" />
              <span className="text-xs text-lime-400 font-semibold">Payday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
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

      {showDepositForm && (
        <OneTimeDepositForm
          onClose={() => setShowDepositForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['oneTimeDeposits'] });
            setShowDepositForm(false);
          }}
        />
      )}
    </div>
  );
}
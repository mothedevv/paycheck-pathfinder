import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Plus, Trash2 } from 'lucide-react';

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(1);
  const [incomes, setIncomes] = useState([{
    name: '',
    paycheck_amount: '',
    next_payday: '',
    pay_frequency: 'biweekly',
    is_primary: true
  }]);
  const [totalBills, setTotalBills] = useState('');
  const [totalDebtPayments, setTotalDebtPayments] = useState('');
  const [monthlySpending, setMonthlySpending] = useState('');
  const [loading, setLoading] = useState(false);

  const addIncome = () => {
    setIncomes([...incomes, {
      name: '',
      paycheck_amount: '',
      next_payday: '',
      pay_frequency: 'biweekly',
      is_primary: false
    }]);
  };

  const removeIncome = (index) => {
    if (incomes.length === 1) return;
    setIncomes(incomes.filter((_, i) => i !== index));
  };

  const updateIncome = (index, field, value) => {
    const newIncomes = [...incomes];
    newIncomes[index][field] = value;
    setIncomes(newIncomes);
  };

  const handleNextStep1 = () => {
    // Validate at least one income with required fields
    const hasValidIncome = incomes.some(inc => 
      inc.name && inc.paycheck_amount && parseFloat(inc.paycheck_amount) > 0
    );
    
    if (hasValidIncome) {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    if (totalBills && parseFloat(totalBills) > 0) {
      setStep(3);
    }
  };

  const handleNextStep3 = () => {
    if (totalDebtPayments !== '') {
      setStep(4);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Calculate total monthly income based on all income sources
      let totalMonthlyIncome = 0;
      for (const income of incomes) {
        if (!income.name || !income.paycheck_amount) continue;
        
        const amount = parseFloat(income.paycheck_amount);
        let monthlyAmount = 0;

        switch (income.pay_frequency) {
          case 'weekly':
            monthlyAmount = amount * 52 / 12;
            break;
          case 'biweekly':
            monthlyAmount = amount * 26 / 12;
            break;
          case 'semimonthly':
            monthlyAmount = amount * 2;
            break;
          case 'monthly':
            monthlyAmount = amount;
            break;
          default:
            monthlyAmount = amount;
        }
        totalMonthlyIncome += monthlyAmount;
      }

      // Create UserBudget
      await base44.entities.UserBudget.create({
        monthly_income: totalMonthlyIncome,
        bills_percentage: 50,
        spending_percentage: 30,
        savings_percentage: 20
      });

      // Create Income records
      for (const income of incomes) {
        if (!income.name || !income.paycheck_amount) continue;
        
        await base44.entities.Income.create({
          name: income.name,
          paycheck_amount: parseFloat(income.paycheck_amount),
          pay_frequency: income.pay_frequency,
          next_payday: income.next_payday || null,
          is_primary: income.is_primary
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error creating budget:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {step === 1 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-lime-700 to-lime-900 flex items-center justify-center">
                  <Calculator size={40} className="text-lime-400" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-3">
                Let's Figure This Sh*t Out
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Time to take control of your money. No more guessing.
              </p>
            </div>

            {/* Income Sources Section */}
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Income Sources</h2>
              <p className="text-sm text-gray-400">Add each person's paycheck info</p>
            </div>
            <Button
              onClick={addIncome}
              className="bg-lime-500/20 text-lime-400 hover:bg-lime-500/30 border border-lime-500/30 h-9 text-sm"
            >
              <Plus size={16} className="mr-1" />
              Add Income
            </Button>
          </div>

          {/* Income Forms */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {incomes.map((income, index) => (
              <div key={index} className="bg-[#252538] border border-white/10 rounded-xl p-4 relative">
                {incomes.length > 1 && (
                  <button
                    onClick={() => removeIncome(index)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-lime-400 text-sm mb-2">
                    <span>$</span>
                    <span>Income {index + 1}</span>
                  </div>
                  <Input
                    value={income.name}
                    onChange={(e) => updateIncome(index, 'name', e.target.value)}
                    placeholder="e.g., John - Main Job, Sarah - Side Hustle"
                    className="bg-[#1a1a2e] border-white/10 text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Paycheck Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        value={income.paycheck_amount}
                        onChange={(e) => updateIncome(index, 'paycheck_amount', e.target.value)}
                        placeholder="0.00"
                        className="pl-7 bg-[#1a1a2e] border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Next Payday</label>
                    <Input
                      type="date"
                      value={income.next_payday}
                      onChange={(e) => updateIncome(index, 'next_payday', e.target.value)}
                      className="bg-[#1a1a2e] border-white/10 text-white text-sm"
                    />
                  </div>
                </div>

                <Select
                  value={income.pay_frequency}
                  onValueChange={(value) => updateIncome(index, 'pay_frequency', value)}
                >
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="irregular">Irregular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

              {/* Next Button */}
              <Button
                onClick={handleNextStep1}
                disabled={!incomes.some(inc => inc.name && inc.paycheck_amount && parseFloat(inc.paycheck_amount) > 0)}
                className="w-full mt-6 bg-lime-600 hover:bg-lime-500 text-black font-bold h-12 text-base"
              >
                Next: Add Your Bills →
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Step 2: Monthly Bills */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-black mb-3">
                What Are Your Monthly Bills?
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Let's figure out your fixed expenses so we can calculate your budget.
              </p>
            </div>

            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Rough Total (Monthly)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                  <Input
                    type="number"
                    value={totalBills}
                    onChange={(e) => setTotalBills(e.target.value)}
                    placeholder="2000"
                    className="pl-10 bg-[#252538] border-white/10 text-white text-lg h-14"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Don't stress the details—you can add individual bills later on the Bills page.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep2}
                  disabled={!totalBills || parseFloat(totalBills) <= 0}
                  className="flex-1 bg-lime-600 hover:bg-lime-500 text-black font-bold h-12 text-base"
                >
                  Next: Add Debt →
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Step 3: Debt Payments */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-black mb-3">
                What About Debt?
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                What are your total minimum payments per month?
              </p>
            </div>

            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Total Minimum Payments (Monthly)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                  <Input
                    type="number"
                    value={totalDebtPayments}
                    onChange={(e) => setTotalDebtPayments(e.target.value)}
                    placeholder="500"
                    className="pl-10 bg-[#252538] border-white/10 text-white text-lg h-14"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Enter 0 if you're debt-free (lucky you!). You can add individual accounts later on the Debt page.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep3}
                  disabled={totalDebtPayments === ''}
                  className="flex-1 bg-lime-600 hover:bg-lime-500 text-black font-bold h-12 text-base"
                >
                  Next: Monthly Spending →
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {/* Step 4: Monthly Spending */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-black mb-3">
                How Much Do You Spend Monthly?
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Food, gas, entertainment, shopping - your typical monthly spending.
              </p>
            </div>

            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Estimated Monthly Spending</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                  <Input
                    type="number"
                    value={monthlySpending}
                    onChange={(e) => setMonthlySpending(e.target.value)}
                    placeholder="e.g., 1500"
                    className="pl-10 bg-[#252538] border-white/10 text-white text-lg h-14"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  This includes groceries, gas, dining out, entertainment, clothes, etc.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading || !monthlySpending || parseFloat(monthlySpending) <= 0}
                  className="flex-1 bg-lime-600 hover:bg-lime-500 text-black font-bold h-12 text-base"
                >
                  {loading ? 'Setting up...' : 'Next: Savings Goals →'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
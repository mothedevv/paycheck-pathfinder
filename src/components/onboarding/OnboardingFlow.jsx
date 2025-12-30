import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) return;

    setLoading(true);
    try {
      await base44.entities.UserBudget.create({
        monthly_income: parseFloat(monthlyIncome),
        bills_percentage: 50,
        spending_percentage: 30,
        savings_percentage: 20
      });
      onComplete();
    } catch (error) {
      console.error('Error creating budget:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3">Welcome!</h1>
          <p className="text-gray-400">Let's set up your budget in seconds</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              What's your monthly income?
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="5000"
                className="pl-10 bg-white/10 border-white/20 text-white"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              We'll use the 50/30/20 rule: 50% bills, 30% spending, 20% savings
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!monthlyIncome || loading}
            className="w-full bg-lime-500 text-black font-bold hover:bg-lime-400"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </Button>
        </div>
      </div>
    </div>
  );
}
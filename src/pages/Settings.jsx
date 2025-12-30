import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import IncomeForm from '@/components/forms/IncomeForm';

export default function Settings() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const { data: budgets = [] } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
    }
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
  
  React.useEffect(() => {
    if (budget) {
      setFormData({
        bills_percentage: budget.bills_percentage || 50,
        spending_percentage: budget.spending_percentage || 30,
        savings_percentage: budget.savings_percentage || 20
      });
    }
  }, [budget]);

  const [formData, setFormData] = useState({
    bills_percentage: budget?.bills_percentage || 50,
    spending_percentage: budget?.spending_percentage || 30,
    savings_percentage: budget?.savings_percentage || 20
  });

  const handleSave = async () => {
    if (!budget) return;
    setLoading(true);
    try {
      // Calculate total monthly income from all income sources
      let totalMonthlyIncome = 0;
      for (const income of incomes) {
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

      await base44.entities.UserBudget.update(budget.id, {
        ...formData,
        monthly_income: totalMonthlyIncome
      });
      queryClient.invalidateQueries({ queryKey: ['userBudget'] });
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-3xl font-black">Settings</h1>
        </div>

        {/* Income Sources */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Income Sources</h2>
            <Button
              onClick={() => {
                setEditingIncome(null);
                setShowIncomeForm(true);
              }}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400 h-9 text-sm"
            >
              <Plus size={16} className="mr-1" />
              Add Income
            </Button>
          </div>

          {incomes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No income sources added yet</p>
          ) : (
            <div className="space-y-2">
              {incomes.map(income => (
                <div
                  key={income.id}
                  onClick={() => {
                    setEditingIncome(income);
                    setShowIncomeForm(true);
                  }}
                  className="bg-[#252538] border border-white/10 rounded-lg p-3 hover:bg-[#2d2f42] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{income.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">
                        {income.pay_frequency.replace('_', '-')} • ${income.paycheck_amount.toLocaleString()}
                        {income.is_primary && <span className="ml-2 text-lime-400">• Primary</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bucket Percentages */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-lg font-bold mb-4">Bucket Percentages</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Bills (%)</Label>
              <Input
                type="number"
                value={formData.bills_percentage}
                onChange={(e) => setFormData({ ...formData, bills_percentage: parseFloat(e.target.value) })}
                className="bg-[#252538] border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Spending (%)</Label>
              <Input
                type="number"
                value={formData.spending_percentage}
                onChange={(e) => setFormData({ ...formData, spending_percentage: parseFloat(e.target.value) })}
                className="bg-[#252538] border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Savings (%)</Label>
              <Input
                type="number"
                value={formData.savings_percentage}
                onChange={(e) => setFormData({ ...formData, savings_percentage: parseFloat(e.target.value) })}
                className="bg-[#252538] border-white/10 text-white"
              />
            </div>

            <p className="text-xs text-gray-400">
              Total: {formData.bills_percentage + formData.spending_percentage + formData.savings_percentage}% 
              {formData.bills_percentage + formData.spending_percentage + formData.savings_percentage !== 100 && (
                <span className="text-amber-400 ml-2">(should equal 100%)</span>
              )}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-lime-500 text-black font-bold hover:bg-lime-400 h-12"
        >
          <Save size={20} className="mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
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
            queryClient.invalidateQueries({ queryKey: ['userBudget'] });
            setShowIncomeForm(false);
            setEditingIncome(null);
          }}
        />
      )}
    </div>
  );
}
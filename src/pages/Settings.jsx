import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Save } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: budgets = [] } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
    }
  });

  const budget = budgets[0];
  
  React.useEffect(() => {
    if (budget) {
      setFormData({
        monthly_income: budget.monthly_income || 0,
        bills_percentage: budget.bills_percentage || 50,
        spending_percentage: budget.spending_percentage || 30,
        savings_percentage: budget.savings_percentage || 20
      });
    }
  }, [budget]);

  const [formData, setFormData] = useState({
    monthly_income: budget?.monthly_income || 0,
    bills_percentage: budget?.bills_percentage || 50,
    spending_percentage: budget?.spending_percentage || 30,
    savings_percentage: budget?.savings_percentage || 20
  });

  const handleSave = async () => {
    if (!budget) return;
    setLoading(true);
    try {
      await base44.entities.UserBudget.update(budget.id, formData);
      queryClient.invalidateQueries({ queryKey: ['userBudget'] });
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black mb-8">Settings</h1>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
          <div>
            <Label>Monthly Income</Label>
            <Input
              type="number"
              value={formData.monthly_income}
              onChange={(e) => setFormData({ ...formData, monthly_income: parseFloat(e.target.value) })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <Label>Bills Percentage (%)</Label>
            <Input
              type="number"
              value={formData.bills_percentage}
              onChange={(e) => setFormData({ ...formData, bills_percentage: parseFloat(e.target.value) })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <Label>Spending Percentage (%)</Label>
            <Input
              type="number"
              value={formData.spending_percentage}
              onChange={(e) => setFormData({ ...formData, spending_percentage: parseFloat(e.target.value) })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <Label>Savings Percentage (%)</Label>
            <Input
              type="number"
              value={formData.savings_percentage}
              onChange={(e) => setFormData({ ...formData, savings_percentage: parseFloat(e.target.value) })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              <Save size={20} className="mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
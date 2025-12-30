import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';

export default function IncomeForm({ income, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: income?.name || '',
    paycheck_amount: income?.paycheck_amount || '',
    pay_frequency: income?.pay_frequency || 'biweekly',
    next_payday: income?.next_payday || '',
    is_primary: income?.is_primary || false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (income) {
        await base44.entities.Income.update(income.id, formData);
      } else {
        await base44.entities.Income.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving income:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!income || !confirm('Delete this income source?')) return;

    setLoading(true);
    try {
      await base44.entities.Income.delete(income.id);
      onSuccess();
    } catch (error) {
      console.error('Error deleting income:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{income ? 'Edit' : 'Add'} Income Source</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Income Source Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Job, Side Hustle"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Paycheck Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.paycheck_amount}
              onChange={(e) => setFormData({ ...formData, paycheck_amount: e.target.value })}
              placeholder="2000"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Pay Frequency</Label>
            <Select value={formData.pay_frequency} onValueChange={(value) => setFormData({ ...formData, pay_frequency: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Next Payday</Label>
            <Input
              type="date"
              value={formData.next_payday}
              onChange={(e) => setFormData({ ...formData, next_payday: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_primary" className="cursor-pointer">Primary household income</Label>
          </div>

          <div className="flex gap-3 pt-4">
            {income && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
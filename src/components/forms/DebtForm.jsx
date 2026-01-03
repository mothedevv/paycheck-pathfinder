import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';

export default function DebtForm({ debt, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: debt?.name || '',
    balance: debt?.balance || '',
    original_balance: debt?.original_balance || debt?.balance || '',
    minimum_payment: debt?.minimum_payment || '',
    apr: debt?.apr || '',
    due_day: debt?.due_day || '',
    statement_day: debt?.statement_day || '',
    type: debt?.type || 'credit_card',
    linked_asset_id: debt?.linked_asset_id || ''
  });
  const [loading, setLoading] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Asset.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        balance: parseFloat(formData.balance),
        original_balance: formData.original_balance ? parseFloat(formData.original_balance) : parseFloat(formData.balance),
        minimum_payment: formData.minimum_payment ? parseFloat(formData.minimum_payment) : undefined,
        apr: parseFloat(formData.apr),
        due_day: parseInt(formData.due_day),
        statement_day: formData.statement_day ? parseInt(formData.statement_day) : undefined,
        linked_asset_id: formData.linked_asset_id || undefined
      };

      let debtId;
      if (debt) {
        await base44.entities.Debt.update(debt.id, dataToSubmit);
        debtId = debt.id;
      } else {
        const newDebt = await base44.entities.Debt.create(dataToSubmit);
        debtId = newDebt.id;
      }

      // Create or update corresponding bill if minimum payment exists
      if (dataToSubmit.minimum_payment) {
        const currentUser = await base44.auth.me();
        const existingBills = await base44.entities.Bill.filter({ 
          created_by: currentUser.email,
          name: `${formData.name} Payment`
        });

        const today = new Date();
        const dueDay = parseInt(formData.due_day);
        let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        if (debt) {
          // Update existing bills with same name
          const relatedBills = await base44.entities.Bill.filter({ 
            created_by: currentUser.email,
            name: `${formData.name} Payment`
          });
          
          const updatePromises = relatedBills.map(b => 
            base44.entities.Bill.update(b.id, {
              amount: dataToSubmit.minimum_payment,
              category: 'debt_payments',
              frequency: 'monthly',
              notes: `Auto-generated from debt: ${formData.name}`
            })
          );
          
          await Promise.all(updatePromises);
        } else {
          // Create bills for this month and next 6 months
          const billsToCreate = [];
          
          for (let i = 0; i < 7; i++) {
            const targetDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + i, dueDay);
            const dueDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
            
            billsToCreate.push({
              name: `${formData.name} Payment`,
              amount: dataToSubmit.minimum_payment,
              due_date: dueDateStr,
              category: 'debt_payments',
              frequency: 'monthly',
              notes: `Auto-generated from debt: ${formData.name}`
            });
          }
          
          await base44.entities.Bill.bulkCreate(billsToCreate);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('Error saving debt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!debt || !confirm('Delete this debt? This will also remove all associated bill payments.')) return;

    setLoading(true);
    try {
      // Delete all associated bills
      const currentUser = await base44.auth.me();
      const existingBills = await base44.entities.Bill.filter({ 
        created_by: currentUser.email,
        name: `${debt.name} Payment`
      });
      
      const deletePromises = existingBills.map(bill => base44.entities.Bill.delete(bill.id));
      await Promise.all(deletePromises);

      await base44.entities.Debt.delete(debt.id);
      onSuccess();
    } catch (error) {
      console.error('Error deleting debt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl max-w-md w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{debt ? 'Edit' : 'Add'} Debt</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Account Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chase Credit Card"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Current Balance</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              placeholder="5000"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>APR (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.apr}
              onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
              placeholder="19.99"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Minimum Payment</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.minimum_payment}
              onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
              placeholder="100"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <Label>Due Day (of month)</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={formData.due_day}
              onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
              placeholder="15"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Debt Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="student_loan">Student Loan</SelectItem>
                <SelectItem value="car_loan">Car Loan</SelectItem>
                <SelectItem value="personal_loan">Personal Loan</SelectItem>
                <SelectItem value="mortgage">Mortgage</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                </SelectContent>
                </Select>
                </div>

                {/* Linked Asset */}
                <div className="space-y-2">
                <Label>Linked Asset (Optional)</Label>
                <Select
                value={formData.linked_asset_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, linked_asset_id: value === 'none' ? '' : value })}
                >
                <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {assets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                ))}
                </SelectContent>
                </Select>
                </div>

          <div className="flex gap-3 pt-4">
            {debt && (
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
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';

export default function BillForm({ bill, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: bill?.name || '',
    amount: bill?.amount || '',
    is_variable: bill?.is_variable || false,
    due_date: bill?.due_date || '',
    late_by_date: bill?.late_by_date || '',
    category: bill?.category || 'utilities',
    subcategory: bill?.subcategory || '',
    is_autopay: bill?.is_autopay || false,
    frequency: bill?.frequency || 'monthly',
    notes: bill?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (bill) {
        await base44.entities.Bill.update(bill.id, formData);
      } else {
        await base44.entities.Bill.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bill || !confirm('Delete this bill?')) return;

    setLoading(true);
    try {
      await base44.entities.Bill.delete(bill.id);
      onSuccess();
    } catch (error) {
      console.error('Error deleting bill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl max-w-md w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{bill ? 'Edit' : 'Add'} Bill</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Bill Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Electric Bill"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="100"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="subscriptions">Subscriptions</SelectItem>
                <SelectItem value="debt_payments">Debt Payments</SelectItem>
                <SelectItem value="child_family">Child/Family</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="taxes">Taxes</SelectItem>
                <SelectItem value="furniture_rental">Furniture/Rental</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_autopay"
              checked={formData.is_autopay}
              onChange={(e) => setFormData({ ...formData, is_autopay: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_autopay" className="cursor-pointer">Auto-pay enabled</Label>
          </div>

          <div className="flex gap-3 pt-4">
            {bill && (
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
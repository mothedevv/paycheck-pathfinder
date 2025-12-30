import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';

export default function AssetForm({ asset, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || 'property',
    current_value: asset?.current_value || '',
    purchase_price: asset?.purchase_price || '',
    purchase_date: asset?.purchase_date || '',
    notes: asset?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (asset) {
        await base44.entities.Asset.update(asset.id, formData);
      } else {
        await base44.entities.Asset.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asset || !confirm('Delete this asset?')) return;

    setLoading(true);
    try {
      await base44.entities.Asset.delete(asset.id);
      onSuccess();
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl max-w-md w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{asset ? 'Edit' : 'Add'} Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Asset Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Primary Home, 2020 Honda Civic"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Asset Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Current Value</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.current_value}
              onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              placeholder="250000"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label>Purchase Price (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              placeholder="200000"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <Label>Purchase Date (Optional)</Label>
            <Input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {asset && (
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
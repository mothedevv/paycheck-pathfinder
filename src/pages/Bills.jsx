import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BillForm from '@/components/forms/BillForm';
import BillCard from '@/components/bills/BillCard';

export default function Bills() {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Bill.filter({ created_by: currentUser.email }, '-due_date');
    }
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
    }
  });

  const budget = budgets[0];
  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const billsAllocation = budget ? (budget.monthly_income * (budget.bills_percentage / 100)) : 0;

  if (isLoading) {
    return <div className="min-h-screen bg-[#0d0d1a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Bills</h1>
            <p className="text-gray-400">
              ${totalBills.toLocaleString()} / ${billsAllocation.toLocaleString()} allocated
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingBill(null);
              setShowForm(true);
            }}
            className="bg-lime-500 text-black font-bold hover:bg-lime-400"
          >
            <Plus size={20} className="mr-2" />
            Add Bill
          </Button>
        </div>

        {bills.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No bills yet. Add your first bill to get started!</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400"
            >
              Add Your First Bill
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map(bill => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={() => {
                  setEditingBill(bill);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <BillForm
          bill={editingBill}
          onClose={() => {
            setShowForm(false);
            setEditingBill(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            setShowForm(false);
            setEditingBill(null);
          }}
        />
      )}
    </div>
  );
}
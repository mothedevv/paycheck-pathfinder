import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Receipt, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const quirkySayings = [
  "Broke is a mindset. Let's change yours.",
  "Stop being broke. It's embarrassing.",
  "Your bills don't pay themselves.",
  "Budget now, thank yourself later.",
];

export default function Bills() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);

  const { data: budgets = [] } = useQuery({
    queryKey: ['userBudget'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserBudget.filter({ created_by: currentUser.email });
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

  const budget = budgets[0];
  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const billsAllocation = budget ? (budget.monthly_income * (budget.bills_percentage / 100)) : 0;

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || bill.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-3xl font-black">Your Bills</h1>
          </div>
          <Button className="bg-lime-500 text-black font-bold hover:bg-lime-400">
            <Plus size={18} className="mr-2" />
            Add Bill
          </Button>
        </div>
        <p className="text-lime-400 italic text-sm ml-14">"{saying}"</p>

        {/* Total Bills Card */}
        <div className="bg-gradient-to-br from-pink-900/40 to-pink-950/20 border border-pink-800/30 rounded-2xl p-6 mt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-pink-200/60 uppercase tracking-wider mb-2">Total Monthly Bills</p>
              <p className="text-5xl font-black mb-1">${totalBills.toLocaleString()}</p>
              <p className="text-sm text-pink-200/60">{bills.length} bills tracked</p>
            </div>
            <div className="p-4 rounded-2xl bg-pink-800/40">
              <Receipt size={32} className="text-pink-300" />
            </div>
          </div>
          
          <div className="border-t border-pink-800/30 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-pink-200/80">Bills Allocation ({budget?.bills_percentage || 50}%)</span>
              <span className="text-lg font-bold">${billsAllocation.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bills..."
            className="pl-11 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 h-12"
          />
        </div>

        {/* Category Filter */}
        <div className="mt-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white h-12">
              <div className="flex items-center gap-2">
                <Filter size={18} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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

        {/* Bills List or Empty State */}
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 mt-8">
            <div className="p-6 rounded-2xl bg-white/5 mb-6">
              <Receipt size={48} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">No bills yet</h3>
            <p className="text-gray-400 text-center text-sm max-w-xs">
              Add your first bill to start tracking where your money goes.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredBills.map(bill => (
              <div
                key={bill.id}
                className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 hover:bg-[#252538] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{bill.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {bill.category?.replace('_', ' ')} • Due {new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${bill.amount.toLocaleString()}</p>
                    {bill.is_autopay && (
                      <p className="text-xs text-lime-400">Auto-pay</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

            <div className="flex flex-col items-center gap-1">
              <div className="text-lime-400">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-xs text-lime-400 font-semibold">Bills</span>
            </div>

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
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
              </svg>
              <span className="text-xs text-gray-400">Payday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
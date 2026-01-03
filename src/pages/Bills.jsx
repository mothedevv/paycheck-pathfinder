import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, Receipt, Search, Filter, MoreVertical, Edit, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BillForm from '@/components/forms/BillForm';

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
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  
  const queryClient = useQueryClient();

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

  // Group bills by month
  const billsByMonth = filteredBills.reduce((acc, bill) => {
    const [y, m] = bill.due_date.split('-').map(Number);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(bill);
    return acc;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.keys(billsByMonth).sort();

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black">Your Bills</h1>
          </div>
          <Button 
            onClick={() => {
              setEditingBill(null);
              setShowBillForm(true);
            }}
            className="bg-lime-500 text-black font-bold hover:bg-lime-400 h-9 sm:h-10 text-sm sm:text-base px-3 sm:px-4"
          >
            <Plus size={16} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Bill</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
        <p className="text-lime-400 italic text-xs sm:text-sm ml-11 sm:ml-14">"{saying}"</p>

        {/* Total Bills Card */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/20 border border-blue-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div>
              <p className="text-xs sm:text-sm text-blue-200/60 uppercase tracking-wider mb-2">Total Monthly Bills</p>
              <p className="text-3xl sm:text-5xl font-black mb-1">${totalBills.toFixed(2)}</p>
              <p className="text-xs sm:text-sm text-blue-200/60">{bills.length} bills tracked</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-800/40">
              <Receipt size={24} className="text-blue-300 sm:w-8 sm:h-8" />
            </div>
          </div>

          <div className="border-t border-blue-800/30 pt-3 sm:pt-4 mt-3 sm:mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-blue-200/80">Bills Allocation ({budget?.bills_percentage || 50}%)</span>
              <span className="text-base sm:text-lg font-bold">${billsAllocation.toFixed(2)}/mo</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 sm:mt-6">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bills..."
            className="pl-10 sm:pl-11 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 h-11 sm:h-12 text-sm sm:text-base"
          />
        </div>

        {/* Category Filter */}
        <div className="mt-3 sm:mt-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white h-11 sm:h-12 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Filter size={16} />
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
          <div className="mt-4 sm:mt-6 space-y-6">
            {sortedMonths.map(monthKey => {
              const [year, month] = monthKey.split('-').map(Number);
              const monthDate = new Date(year, month - 1, 1);
              const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

              return (
                <div key={monthKey}>
                  <h2 className="text-lg sm:text-xl font-bold mb-3 text-lime-400">{monthName}</h2>
                  <div className="space-y-2 sm:space-y-3">
                    {billsByMonth[monthKey].map(bill => (
              <div
                key={bill.id}
                className={(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const [y, m, d] = bill.due_date.split('-').map(Number);
                  const dueDate = new Date(y, m - 1, d);
                  const lateByDate = bill.late_by_date ? (() => {
                    const [ly, lm, ld] = bill.late_by_date.split('-').map(Number);
                    return new Date(ly, lm - 1, ld);
                  })() : dueDate;

                  const isLate = !bill.last_paid_date && today > lateByDate;

                  return isLate 
                    ? "bg-red-900/30 border border-red-500/50 rounded-xl p-3 sm:p-4 hover:bg-red-900/40 transition-colors"
                    : "bg-[#1a1a2e] border border-white/10 rounded-xl p-3 sm:p-4 hover:bg-[#252538] transition-colors";
                })()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">{bill.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 capitalize truncate">
                        {bill.category?.replace('_', ' ')} • Due {(() => {
                          const [y, m, d] = bill.due_date.split('-').map(Number);
                          const date = new Date(y, m - 1, d);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        })()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-base sm:text-lg font-bold">${bill.amount.toFixed(2)}</p>
                        {bill.is_autopay && (
                          <p className="text-xs text-lime-400">Auto-pay</p>
                        )}
                        {bill.last_paid_date && (
                          <p className="text-xs text-green-400">✓ Paid</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingBill(bill);
                            setShowBillForm(true);
                          }}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!bill.last_paid_date ? (
                            <DropdownMenuItem onClick={async () => {
                              try {
                                const today = new Date();
                                const yyyy = today.getFullYear();
                                const mm = String(today.getMonth() + 1).padStart(2, '0');
                                const dd = String(today.getDate()).padStart(2, '0');
                                await base44.entities.Bill.update(bill.id, {
                                  last_paid_date: `${yyyy}-${mm}-${dd}`
                                });
                                queryClient.invalidateQueries({ queryKey: ['bills'] });
                              } catch (error) {
                                console.error('Error marking bill as paid:', error);
                              }
                            }}>
                              <Check size={14} className="mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={async () => {
                              try {
                                await base44.entities.Bill.update(bill.id, {
                                  last_paid_date: null
                                });
                                queryClient.invalidateQueries({ queryKey: ['bills'] });
                              } catch (error) {
                                console.error('Error unmarking bill:', error);
                              }
                            }}>
                              <X size={14} className="mr-2" />
                              Unmark as Paid
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                      </div>
                      </div>
                          ))}
                        </div>
                      </div>
                      );
                      })}
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

            <Link to={createPageUrl('Payday')} className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
              </svg>
              <span className="text-xs text-gray-400">Payday</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bill Form Modal */}
      {showBillForm && (
        <BillForm
          bill={editingBill}
          onClose={() => {
            setShowBillForm(false);
            setEditingBill(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            setShowBillForm(false);
            setEditingBill(null);
          }}
        />
      )}
    </div>
  );
}
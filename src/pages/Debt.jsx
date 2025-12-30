import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingDown, Receipt, Calendar, Home, Car, Package, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DebtForm from '@/components/forms/DebtForm';
import AssetForm from '@/components/forms/AssetForm';

const quirkySayings = [
  "Your credit card is not free money. Shocking, I know.",
  "Debt is like that ex who won't leave you alone.",
  "Interest is the price of impatience.",
  "Your future self called. They want their money back.",
];

export default function Debt() {
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Debt.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Asset.filter({ created_by: currentUser.email });
    },
    refetchOnWindowFocus: false
  });

  // Calculate totals
  const totalAssetValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalDebtValue = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const netWorth = totalAssetValue - totalDebtValue;

  const getAssetIcon = (type) => {
    switch(type) {
      case 'property': return Home;
      case 'vehicle': return Car;
      default: return Package;
    }
  };

  const getLinkedDebt = (assetId) => {
    return debts.find(d => d.linked_asset_id === assetId);
  };

  const getLinkedAsset = (debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt?.linked_asset_id) return null;
    return assets.find(a => a.id === debt.linked_asset_id);
  };

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
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              Assets<br />& Debt
            </h1>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button 
              onClick={() => {
                setEditingAsset(null);
                setShowAssetForm(true);
              }}
              className="bg-[#1a1a2e] border border-white/20 text-white hover:bg-[#252538] h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4 font-semibold"
            >
              <Plus size={14} className="mr-1" />
              Asset
            </Button>
            <Button 
              onClick={() => {
                setEditingDebt(null);
                setShowDebtForm(true);
              }}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400 h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
            >
              <Plus size={14} className="mr-1" />
              Debt
            </Button>
          </div>
        </div>
        <p className="text-lime-400 italic text-xs sm:text-sm ml-11 sm:ml-14">"{saying}"</p>

        {/* Summary Cards */}
        <div className="mt-4 sm:mt-6 space-y-3">
          {/* Assets Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Assets</h2>
            <Button 
              onClick={() => {
                setEditingAsset(null);
                setShowAssetForm(true);
              }}
              className="bg-lime-500 text-black font-bold hover:bg-lime-400 h-9 text-sm px-3"
            >
              <Plus size={14} className="mr-1" />
              Add Asset
            </Button>
          </div>

          {/* Total Value Card */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/30 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-200/60 text-xs uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-3xl font-black text-lime-400">${totalAssetValue.toLocaleString()}</p>
          </div>

          {/* Owed Card */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-950/30 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-200/60 text-xs uppercase tracking-wider mb-1">Owed</p>
            <p className="text-3xl font-black text-red-400">${totalDebtValue.toLocaleString()}</p>
          </div>

          {/* Net Worth Card */}
          <div className="bg-gradient-to-br from-lime-900/40 to-lime-950/30 border border-lime-500/30 rounded-xl p-4">
            <p className="text-lime-200/60 text-xs uppercase tracking-wider mb-1">Net Worth</p>
            <p className="text-3xl font-black text-lime-400">${netWorth.toLocaleString()}</p>
          </div>
        </div>

        {/* Individual Assets */}
        {assets.length > 0 && (
          <div className="mt-6 space-y-3">
            {assets.map(asset => {
              const Icon = getAssetIcon(asset.type);
              const linkedDebt = getLinkedDebt(asset.id);
              const equity = linkedDebt ? asset.current_value - linkedDebt.balance : asset.current_value;
              const paidOffPercent = linkedDebt && linkedDebt.original_balance ? 
                Math.round(((linkedDebt.original_balance - linkedDebt.balance) / linkedDebt.original_balance) * 100) : 0;

              return (
                <div
                  key={asset.id}
                  className="bg-gradient-to-br from-[#1f2a2e] to-[#1a1a2e] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-lime-500/20">
                        <Icon className="text-lime-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base">{asset.name}</h3>
                        <p className="text-xs text-gray-400 capitalize">{asset.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => {
                          setEditingAsset(asset);
                          setShowAssetForm(true);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Current Value</span>
                      <span className="text-xl font-bold text-lime-400">${asset.current_value.toLocaleString()}</span>
                    </div>

                    {linkedDebt && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Owed ({linkedDebt.name})</span>
                          <span className="text-lg font-bold text-red-400">${linkedDebt.balance.toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Equity</span>
                      <span className="text-xl font-bold text-white">${equity.toLocaleString()}</span>
                    </div>

                    {linkedDebt && paidOffPercent > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs text-gray-500">Paid off</span>
                        <span className="text-sm font-semibold text-lime-400">
                          {paidOffPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Debts Section */}
        {debts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Debts</h2>
              <Button 
                onClick={() => {
                  setEditingDebt(null);
                  setShowDebtForm(true);
                }}
                className="bg-lime-500 text-black font-bold hover:bg-lime-400 h-9 text-sm px-3"
              >
                <Plus size={14} className="mr-1" />
                Add Debt
              </Button>
            </div>
            <div className="space-y-3">
              {debts.map(debt => {
                const linkedAsset = getLinkedAsset(debt.id);
                const paidOffPercent = debt.original_balance ? 
                  Math.round(((debt.original_balance - debt.balance) / debt.original_balance) * 100) : 0;

                return (
                  <div
                    key={debt.id}
                    className="bg-gradient-to-br from-[#2a1f1f] to-[#1a1a2e] border border-red-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-base">{debt.name}</h3>
                        <p className="text-xs text-gray-400 capitalize">
                          {debt.type?.replace('_', ' ')}
                          {linkedAsset && <span className="ml-2">• {linkedAsset.name}</span>}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingDebt(debt);
                          setShowDebtForm(true);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit size={14} />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Balance</span>
                        <span className="text-xl font-bold text-red-400">${debt.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">APR</span>
                        <span className="text-white font-semibold">{debt.apr}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                        <span className="text-gray-500">Min Payment</span>
                        <span className="text-gray-300">${debt.minimum_payment?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Due Day</span>
                        <span className="text-gray-300">{debt.due_day}</span>
                      </div>
                      {paidOffPercent > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-xs text-gray-500">Paid off</span>
                          <span className="text-sm font-semibold text-lime-400">
                            {paidOffPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {assets.length === 0 && debts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 mt-12">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-lime-900/20 to-lime-950/10 mb-6">
              <TrendingDown size={64} className="text-lime-500" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black mb-3">
              Track your assets & debt
            </h2>
            <p className="text-gray-400 text-center text-sm max-w-sm mb-8 leading-relaxed">
              Start by adding your assets (home, car) and any debts to see your net worth.
            </p>
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

            <Link to={createPageUrl('Bills')} className="flex flex-col items-center gap-1">
              <Receipt className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Bills</span>
            </Link>

            <div className="flex flex-col items-center gap-1">
              <div className="text-lime-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                  <path d="M2 10h20" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-xs text-lime-400 font-semibold">Debt</span>
            </div>

            <Link to={createPageUrl('Savings')} className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs text-gray-400">Savings</span>
            </Link>

            <Link to={createPageUrl('Payday')} className="flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Payday</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Forms */}
      {showDebtForm && (
        <DebtForm
          debt={editingDebt}
          onClose={() => {
            setShowDebtForm(false);
            setEditingDebt(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setShowDebtForm(false);
            setEditingDebt(null);
          }}
        />
      )}

      {showAssetForm && (
        <AssetForm
          asset={editingAsset}
          onClose={() => {
            setShowAssetForm(false);
            setEditingAsset(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            setShowAssetForm(false);
            setEditingAsset(null);
          }}
        />
      )}
    </div>
  );
}
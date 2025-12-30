import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingDown, Receipt, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const quirkySayings = [
  "Your credit card is not free money. Shocking, I know.",
  "Debt is like that ex who won't leave you alone.",
  "Interest is the price of impatience.",
  "Your future self called. They want their money back.",
];

export default function Debt() {
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);

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
            <h1 className="text-3xl font-black leading-tight">
              Assets<br />& Debt
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Plus size={18} className="mr-1" />
              Asset
            </Button>
            <Button className="bg-lime-500 text-black font-bold hover:bg-lime-400">
              <Plus size={18} className="mr-1" />
              Debt
            </Button>
          </div>
        </div>
        <p className="text-lime-400 italic text-sm ml-14">"{saying}"</p>

        {/* Empty State */}
        {debts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 mt-12">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-lime-900/20 to-lime-950/10 mb-6">
              <TrendingDown size={64} className="text-lime-500" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black mb-3">
              No debt? Hell yeah! 🎉
            </h2>
            <p className="text-gray-400 text-center text-sm max-w-sm mb-8 leading-relaxed">
              Either you're debt-free (congrats!) or you haven't added your debts yet. Be honest with yourself.
            </p>
            <Button className="bg-lime-500 text-black font-bold hover:bg-lime-400 px-8 h-12">
              <Plus size={20} className="mr-2" />
              Add Debt Account
            </Button>
          </div>
        )}

        {/* Debt List */}
        {debts.length > 0 && (
          <div className="mt-6 space-y-3">
            {debts.map(debt => (
              <div
                key={debt.id}
                className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 hover:bg-[#252538] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{debt.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {debt.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-400">${debt.balance.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{debt.apr}% APR</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-white/5">
                  <span>Min payment: ${debt.minimum_payment?.toLocaleString() || 0}</span>
                  <span>Due day: {debt.due_day}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assets Section */}
        {assets.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Your Assets</h2>
            <div className="space-y-3">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 hover:bg-[#252538] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{asset.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {asset.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${asset.current_value.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Payday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
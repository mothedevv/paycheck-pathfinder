import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Target, Receipt, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const quirkySayings = [
  "Debt is heavy. Let's get that weight off.",
  "Save now, flex later.",
  "Your future self will thank you.",
  "Small savings, big dreams.",
];

export default function Savings() {
  const [saying] = useState(() => quirkySayings[Math.floor(Math.random() * quirkySayings.length)]);

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.SavingsGoal.filter({ created_by: currentUser.email });
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
              Savings<br />Goals
            </h1>
          </div>
          <Button className="bg-lime-500 text-black font-bold hover:bg-lime-400">
            <Plus size={18} className="mr-2" />
            Add Goal
          </Button>
        </div>
        <p className="text-lime-400 italic text-sm ml-14">"{saying}"</p>

        {/* Empty State */}
        {savingsGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 mt-12">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-lime-900/20 to-lime-950/10 mb-6">
              <Target size={64} className="text-lime-500" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black mb-4">
              No savings goals yet
            </h2>
            <p className="text-gray-400 text-center text-sm max-w-sm mb-8 leading-relaxed">
              What are you saving for? Emergency fund? Vacation? New car? Set a goal and watch your progress.
            </p>
            <Button className="bg-lime-500 text-black font-bold hover:bg-lime-400 px-8 h-12">
              <Plus size={20} className="mr-2" />
              Create Your First Goal
            </Button>
          </div>
        )}

        {/* Goals List */}
        {savingsGoals.length > 0 && (
          <div className="mt-6 space-y-3">
            {savingsGoals.map(goal => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <div
                  key={goal.id}
                  className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 hover:bg-[#252538] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{goal.name}</h3>
                      {goal.target_date && (
                        <p className="text-sm text-gray-400">
                          Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-lime-400">${goal.current_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">of ${goal.target_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-lime-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{Math.round(progress)}% complete</p>
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

            <Link to={createPageUrl('Bills')} className="flex flex-col items-center gap-1">
              <Receipt className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Bills</span>
            </Link>

            <Link to={createPageUrl('Debt')} className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                <path d="M2 10h20" strokeWidth="2" />
              </svg>
              <span className="text-xs text-gray-400">Debt</span>
            </Link>

            <div className="flex flex-col items-center gap-1">
              <div className="text-lime-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs text-lime-400 font-semibold">Savings</span>
            </div>

            <Link to={createPageUrl('Payday')} className="flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Payday</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
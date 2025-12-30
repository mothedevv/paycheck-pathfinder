import React from 'react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0d0d1a] flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a06ada05a19bd00ecd25e/4f5b9641b_ChatGPTImageDec30202501_41_17PM.png"
          alt="Loading"
          className="w-full max-w-md px-8 animate-pulse"
        />
        
        {/* Animated Loading Bar */}
        <div className="w-96 h-2 bg-gray-800/50 rounded-full overflow-hidden mt-8">
          <div className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-lime-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" 
               style={{ width: '60%' }} />
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  );
}
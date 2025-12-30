import React from 'react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0d0d1a] flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a06ada05a19bd00ecd25e/808023050_ChatGPTImageDec30202501_37_49PM.png"
          alt="Loading"
          className="w-full max-w-md px-8 animate-pulse"
        />
      </div>
    </div>
  );
}
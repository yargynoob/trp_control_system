"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/organizations');
  }, [router]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 bg-[#007bff] rounded-lg mx-auto mb-4"></div>
        <p className="text-[#6c757d]">Переадресация...</p>
      </div>
    </main>);

}
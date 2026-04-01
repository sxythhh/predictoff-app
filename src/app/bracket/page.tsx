"use client";

import { BracketView } from "@/components/bracket/BracketView";
import { mockBracket } from "@/lib/bracket-mock-data";

export default function BracketPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-[24px] font-bold text-text-primary">{mockBracket.title}</h1>
          <p className="text-[14px] text-text-muted mt-1">Tournament Bracket</p>
        </div>
        <BracketView data={mockBracket} />
      </div>
    </div>
  );
}

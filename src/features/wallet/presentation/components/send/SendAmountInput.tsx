"use client";

import React from "react";
import type { AssetBalance } from "@/features/wallet";
import { getAssetName, getFormattedBalance } from "./send-types";

interface SendAmountInputProps {
  amount: string;
  onChangeAmount: (val: string) => void;
  selectedAsset: AssetBalance;
  error?: string | null;
  disabled?: boolean;
}

export function SendAmountInput({
  amount,
  onChangeAmount,
  selectedAsset,
  error,
  disabled = false,
}: SendAmountInputProps) {
  const assetName = getAssetName(selectedAsset);
  const maxBalanceNum = parseFloat(selectedAsset.balance) || 0;

  const handlePercentage = (percent: number) => {
    if (disabled || maxBalanceNum <= 0) return;
    const computed = (maxBalanceNum * (percent / 100)).toFixed(7);
    // Remove trailing zeros after decimal point
    const formatted = parseFloat(computed).toString();
    onChangeAmount(formatted);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string, decimals
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onChangeAmount(val);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[#C2C7D0] text-[12px] uppercase font-semibold">
          Amount to Send
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#8F8389]">
            Avail: <span className="text-white font-medium">{getFormattedBalance(selectedAsset)}</span>
          </span>
          <button
            type="button"
            onClick={() => handlePercentage(100)}
            disabled={disabled || maxBalanceNum <= 0}
            className="text-[10px] font-bold text-[#BCED09] hover:text-[#d4f53a] uppercase px-1.5 py-0.5 rounded bg-[#BCED09]/10 hover:bg-[#BCED09]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
          className="bg-[#0D1117] w-full border border-[#1C2128] rounded-xl px-4 py-3.5 pr-20 text-[#F1F5F9] placeholder:text-[#64748B] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#BCED09] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        <div className="absolute inset-y-0 right-4 flex items-center gap-1.5 pointer-events-none">
          <span className="text-xs font-bold text-[#BCED09] uppercase px-2 py-1 rounded bg-[#BCED09]/10 border border-[#BCED09]/20 select-none">
            {assetName}
          </span>
        </div>
      </div>

      {/* Percentage quick pills */}
      <div className="flex items-center gap-2 mt-2">
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => handlePercentage(pct)}
            disabled={disabled || maxBalanceNum <= 0}
            className="flex-1 py-1 text-[10px] font-bold text-gray-400 bg-[#161618] hover:bg-[#1f2a1a] hover:text-[#BCED09] border border-[#1F2937] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {pct === 100 ? "MAX" : `${pct}%`}
          </button>
        ))}
      </div>

      {error && <span className="text-red-400 text-[11px] mt-1.5 font-medium">{error}</span>}
    </div>
  );
}

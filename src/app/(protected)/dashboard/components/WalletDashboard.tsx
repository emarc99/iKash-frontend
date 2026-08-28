"use client"

import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@/features/wallet";
import { useWalletBalanceViewModel } from "@/features/dashboard/hooks/useWalletBalanceViewModel";
import { WalletBalanceCard } from "@/features/dashboard/components/WalletBalanceCard";
import { WalletAssetList } from "@/features/dashboard/components/WalletAssetList";
import { useState } from "react";
import dynamic from "next/dynamic";
const SendFundsModal = dynamic(() => import("./SendFundsModal").then(mod => mod.SendFundsModal), { ssr: false });
const ReceiveFundsModal = dynamic(() => import("./ReceiveFundsModal").then(mod => mod.ReceiveFundsModal), { ssr: false });
const CreateOfferModal = dynamic(() => import("../../p2p/components/CreateOfferModal").then(mod => mod.CreateOfferModal), { ssr: false });
import { useSearchParams } from "next/navigation";

const SECONDARY_ACTIONS = [
    { src: "/Clip.png", label: "Offers", href: "/p2p" },
    { src: "/Cart.png", label: "Buy", href: "/p2p" },
    { src: "/Bank.png", label: "Withdraw", href: "/transactions" },
];

export function WalletDashboard() {
    const { publicKey } = useWallet();
    const { viewModel, isLoading, error, retry } = useWalletBalanceViewModel(publicKey);

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);

    const searchParams = useSearchParams();
    const sendParam = searchParams.get("send");
    const walletParam = searchParams.get("wallet");
    const [isSendModalOpen, setIsSendModalOpen] = useState(sendParam === "true" || !!walletParam);

    const circleButton =
        "inline-flex items-center justify-center w-11 h-11 rounded-full overflow-hidden shrink-0 transition-opacity hover:opacity-80";

    const actions = (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
                type="button"
                onClick={() => setIsCreateOfferModalOpen(true)}
                className="flex items-center gap-3 bg-[#BCED09] hover:bg-[#d4f53a] text-black text-sm font-bold pl-6 pr-5 py-3.5 rounded-full transition-colors shrink-0"
            >
                Create Offer
                <svg viewBox="0 0 14 14" className="w-4 h-4" fill="none" aria-hidden="true">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            <div className="flex items-center gap-3 flex-wrap">
                <button
                    type="button"
                    aria-label="Send funds"
                    title="Send"
                    className={circleButton}
                    onClick={() => setIsSendModalOpen(true)}
                >
                    <Image src="/arrow-up.png" alt="" width={44} height={44} className="w-full h-full object-cover" />
                </button>
                <button
                    type="button"
                    aria-label="Receive funds"
                    title="Receive"
                    className={circleButton}
                    onClick={() => setIsReceiveModalOpen(true)}
                >
                    <Image src="/arrow-down.png" alt="" width={44} height={44} className="w-full h-full object-cover" />
                </button>

                {SECONDARY_ACTIONS.map((action) => (
                    <Link
                        key={action.src}
                        href={action.href}
                        aria-label={action.label}
                        title={action.label}
                        className={circleButton}
                    >
                        <Image src={action.src} alt="" width={44} height={44} className="w-full h-full object-cover" />
                    </Link>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full min-w-0 flex flex-col pt-6 px-4 pb-8 md:pt-10 md:px-12 md:pb-10">
            <div className="w-full rounded-3xl border border-[#1A1A1E] bg-[#0A0A0C] p-4 md:p-6">
                <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8">
                    <WalletBalanceCard
                        totalBalance={viewModel.totalBalance}
                        currency={viewModel.currency}
                        isLoading={isLoading}
                        error={error}
                        onRetry={retry}
                        actions={actions}
                    />

                    <WalletAssetList
                        assets={viewModel.assets}
                        isLoading={isLoading}
                        error={error}
                        onRetry={retry}
                    />
                </div>
            </div>

            {isSendModalOpen && <SendFundsModal onClose={() => setIsSendModalOpen(false)} />}
            {isReceiveModalOpen && <ReceiveFundsModal onClose={() => setIsReceiveModalOpen(false)} />}
            {isCreateOfferModalOpen && <CreateOfferModal onClose={() => setIsCreateOfferModalOpen(false)} />}
        </div>
    );
}

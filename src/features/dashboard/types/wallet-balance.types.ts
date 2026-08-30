export interface WalletAssetViewModel {
    code: string;
    name: string;
    icon?: string;
    balance: string;
    rawBalance: number;
    issuer: string | null;
    isPriced: boolean;
}

export interface WalletBalanceViewModel {
    totalBalance: string;
    currency: string;
    assets: WalletAssetViewModel[];
    unpricedAssetCount: number;
}

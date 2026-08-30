/**
 * Escrow statuses as they come from the backend.
 * Must stay in sync with the backend enum and with EscrowOnChain.escrowStatus
 * in src/features/order/models/order.ts.
 */
export type EscrowStatus =
    | "pending"
    | "initialized"
    | "funded"
    | "fiat_sent"
    | "released"
    | "disputed"
    | "resolved";

/**
 * Payload emitted by the backend over WebSocket when an escrow status changes.
 * Event name: `escrow-status-updated`
 */
export interface EscrowStatusEvent {
    orderId: string;
    escrowId: string;
    status: EscrowStatus;
    transactionHash?: string;
    updatedAt: string;
    /** Unique event identifier used for deduplication. */
    eventId?: string;
}

/** Connection / sync status surfaced to the UI. */
export type EscrowSyncStatus =
    | "idle"
    | "syncing"
    | "synchronized"
    | "polling"
    | "reconnecting"
    | "error";

export interface EscrowSyncState {
    status: EscrowSyncStatus;
    lastUpdated: string | null;
    /** Whether the sync is driven by a WebSocket connection or polling. */
    source: "websocket" | "polling" | null;
}

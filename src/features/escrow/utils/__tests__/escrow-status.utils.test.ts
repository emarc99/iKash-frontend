import { describe, it, expect } from "vitest";
import {
    isTerminalStatus,
    deduplicationKey,
    TERMINAL_ESCROW_STATUSES,
    POLL_INTERVAL_MS,
} from "../escrow-status.utils";
import type { EscrowStatusEvent } from "../../types/escrow-events.types";

describe("escrow-status.utils", () => {
    describe("isTerminalStatus", () => {
        it("returns true for released", () => {
            expect(isTerminalStatus("released")).toBe(true);
        });

        it("returns true for resolved", () => {
            expect(isTerminalStatus("resolved")).toBe(true);
        });

        it("returns false for pending", () => {
            expect(isTerminalStatus("pending")).toBe(false);
        });

        it("returns false for initialized", () => {
            expect(isTerminalStatus("initialized")).toBe(false);
        });

        it("returns false for funded", () => {
            expect(isTerminalStatus("funded")).toBe(false);
        });

        it("returns false for fiat_sent", () => {
            expect(isTerminalStatus("fiat_sent")).toBe(false);
        });

        it("returns false for disputed", () => {
            expect(isTerminalStatus("disputed")).toBe(false);
        });
    });

    describe("deduplicationKey", () => {
        it("uses eventId when present", () => {
            const event: EscrowStatusEvent = {
                orderId: "o1",
                escrowId: "e1",
                status: "funded",
                updatedAt: "2026-01-01T00:00:00Z",
                eventId: "evt-abc",
            };
            expect(deduplicationKey(event)).toBe("evt:evt-abc");
        });

        it("falls back to composite key when eventId is absent", () => {
            const event: EscrowStatusEvent = {
                orderId: "o1",
                escrowId: "e1",
                status: "funded",
                transactionHash: "tx-hash-123",
                updatedAt: "2026-01-01T00:00:00Z",
            };
            expect(deduplicationKey(event)).toBe(
                "sha:funded:tx-hash-123:2026-01-01T00:00:00Z",
            );
        });

        it("handles missing transactionHash gracefully", () => {
            const event: EscrowStatusEvent = {
                orderId: "o1",
                escrowId: "e1",
                status: "pending",
                updatedAt: "2026-01-01T00:00:00Z",
            };
            expect(deduplicationKey(event)).toBe(
                "sha:pending::2026-01-01T00:00:00Z",
            );
        });

        it("produces different keys for different events", () => {
            const a: EscrowStatusEvent = {
                orderId: "o1",
                escrowId: "e1",
                status: "funded",
                updatedAt: "2026-01-01T00:00:00Z",
                eventId: "evt-1",
            };
            const b: EscrowStatusEvent = {
                orderId: "o1",
                escrowId: "e1",
                status: "funded",
                updatedAt: "2026-01-01T00:00:00Z",
                eventId: "evt-2",
            };
            expect(deduplicationKey(a)).not.toBe(deduplicationKey(b));
        });

        it("produces the same key for the same eventId regardless of other fields", () => {
            const a: EscrowStatusEvent = {
                orderId: "o1",
                escrowId: "e1",
                status: "funded",
                updatedAt: "2026-01-01T00:00:00Z",
                eventId: "evt-same",
            };
            const b: EscrowStatusEvent = {
                orderId: "o2",
                escrowId: "e2",
                status: "released",
                updatedAt: "2026-12-31T23:59:59Z",
                eventId: "evt-same",
            };
            expect(deduplicationKey(a)).toBe(deduplicationKey(b));
        });
    });

    describe("TERMINAL_ESCROW_STATUSES", () => {
        it("contains released and resolved", () => {
            expect(TERMINAL_ESCROW_STATUSES).toContain("released");
            expect(TERMINAL_ESCROW_STATUSES).toContain("resolved");
        });

        it("does not contain disputed (may still receive updates)", () => {
            expect(TERMINAL_ESCROW_STATUSES).not.toContain("disputed");
        });
    });

    describe("POLL_INTERVAL_MS", () => {
        it("is between 5 and 10 seconds (issue requirement)", () => {
            expect(POLL_INTERVAL_MS).toBeGreaterThanOrEqual(5000);
            expect(POLL_INTERVAL_MS).toBeLessThanOrEqual(10000);
        });

        it("is not 1 second (issue explicitly forbids this)", () => {
            expect(POLL_INTERVAL_MS).not.toBe(1000);
        });
    });
});

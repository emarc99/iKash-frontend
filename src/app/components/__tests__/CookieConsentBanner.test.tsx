import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { CookieConsentBanner } from "../CookieConsentBanner";

const CONSENT_STORAGE_KEY = "ikash_cookie_consent";

describe("CookieConsentBanner", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("shows the banner when no consent has been stored yet", async () => {
        render(<CookieConsentBanner />);

        await waitFor(() => {
            expect(screen.getByRole("region", { name: /cookie consent/i })).toBeTruthy();
        });
    });

    it("does not show the banner when consent was already recorded", async () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");

        render(<CookieConsentBanner />);

        await waitFor(() => {
            expect(screen.queryByRole("region", { name: /cookie consent/i })).toBeNull();
        });
    });

    it("persists acceptance and hides the banner", async () => {
        render(<CookieConsentBanner />);
        await waitFor(() => screen.getByRole("button", { name: /accept/i }));

        fireEvent.click(screen.getByRole("button", { name: /accept/i }));

        expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
        expect(screen.queryByRole("region", { name: /cookie consent/i })).toBeNull();
    });

    it("persists decline and hides the banner", async () => {
        render(<CookieConsentBanner />);
        await waitFor(() => screen.getByRole("button", { name: /decline/i }));

        fireEvent.click(screen.getByRole("button", { name: /decline/i }));

        expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("declined");
        expect(screen.queryByRole("region", { name: /cookie consent/i })).toBeNull();
    });

    it("links to the privacy policy", async () => {
        render(<CookieConsentBanner />);

        await waitFor(() => {
            const link = screen.getByRole("link", { name: /privacy policy/i });
            expect(link.getAttribute("href")).toBe("/privacy");
        });
    });
});

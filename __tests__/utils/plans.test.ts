import {
    calculatePlatformFee,
    formatCommissionRate,
    PLANS,
} from "../../src/constants/plans";

describe("plans — commission calculation", () => {
  // Modèle actuel :
  //   free       → 3% commission, min $0.50 AUD
  //   pro        → 0% commission (abonnement $99/mo)
  //   enterprise → 0% commission (abonnement $179/mo)

  describe("calculatePlatformFee", () => {
    it("applies 3% fee for free plan", () => {
      expect(calculatePlatformFee(100, "free")).toBe(3.0);
    });

    it("pro plan has 0% commission (flat subscription model)", () => {
      expect(calculatePlatformFee(100, "pro")).toBe(0);
    });

    it("enterprise plan has 0% commission (flat subscription model)", () => {
      expect(calculatePlatformFee(100, "enterprise")).toBe(0);
    });

    it("enforces $0.50 minimum for free plan", () => {
      // 3% of $10 = $0.30 → rounded up to $0.50 minimum
      expect(calculatePlatformFee(10, "free")).toBe(0.5);
    });

    it("pro plan returns 0 regardless of amount (no minimum)", () => {
      expect(calculatePlatformFee(10, "pro")).toBe(0);
      expect(calculatePlatformFee(0, "pro")).toBe(0);
    });

    it("enterprise plan returns 0 regardless of amount (no minimum)", () => {
      expect(calculatePlatformFee(10, "enterprise")).toBe(0);
      expect(calculatePlatformFee(0, "enterprise")).toBe(0);
    });

    it("handles zero amount", () => {
      expect(calculatePlatformFee(0, "free")).toBe(0.5); // minimum applies
      expect(calculatePlatformFee(0, "enterprise")).toBe(0);
    });

    it("defaults to free plan when planType is omitted", () => {
      expect(calculatePlatformFee(100)).toBe(calculatePlatformFee(100, "free"));
    });

    it("rounds fee to 2 decimal places", () => {
      // 3% of $33.33 = $0.9999 → rounds to $1.00
      expect(calculatePlatformFee(33.33, "free")).toBe(1.0);
    });

    it("large amounts scale correctly for free plan", () => {
      expect(calculatePlatformFee(1000, "free")).toBe(30.0);
      expect(calculatePlatformFee(1000, "pro")).toBe(0);
      expect(calculatePlatformFee(1000, "enterprise")).toBe(0);
    });
  });

  describe("formatCommissionRate", () => {
    it('returns "3%" for free plan', () => {
      expect(formatCommissionRate("free")).toBe("3%");
    });

    it('returns "0%" for pro plan (flat subscription)', () => {
      expect(formatCommissionRate("pro")).toBe("0%");
    });

    it('returns "0%" for enterprise plan (flat subscription)', () => {
      expect(formatCommissionRate("enterprise")).toBe("0%");
    });

    it("defaults to free plan when omitted", () => {
      expect(formatCommissionRate()).toBe("3%");
    });
  });

  describe("PLANS constant", () => {
    it("free plan is publicly available", () => {
      expect(PLANS.free.publiclyAvailable).toBe(true);
    });

    it("pro and enterprise are not publicly available at launch", () => {
      expect(PLANS.pro.publiclyAvailable).toBe(false);
      expect(PLANS.enterprise.publiclyAvailable).toBe(false);
    });
  });
});

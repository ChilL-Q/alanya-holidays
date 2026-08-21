import { describe, it, expect } from "vitest";
import { Money } from "./money.vo";

describe("Frontend Money Value Object", () => {
  describe("Creation and Invariants", () => {
    it("should create a valid Money instance with default currency EUR", () => {
      const money = new Money(100);
      expect(money.amount).toBe(100);
      expect(money.cents).toBe(10000);
      expect(money.currency).toBe("EUR");
    });

    it("should create a valid Money instance with custom valid currency", () => {
      const moneyUSD = new Money(250.5, "USD");
      expect(moneyUSD.amount).toBe(250.5);
      expect(moneyUSD.cents).toBe(25050);
      expect(moneyUSD.currency).toBe("USD");

      const moneyTRY = new Money(1000, "TRY");
      expect(moneyTRY.amount).toBe(1000);
      expect(moneyTRY.cents).toBe(100000);
      expect(moneyTRY.currency).toBe("TRY");
    });

    it("should create Money using static factory fromCents", () => {
      const money = Money.fromCents(1999, "EUR");
      expect(money.cents).toBe(1999);
      expect(money.amount).toBe(19.99);
      expect(money.currency).toBe("EUR");
    });

    it("should create Money using static factory fromDecimal", () => {
      const money = Money.fromDecimal(19.99, "EUR");
      expect(money.cents).toBe(1999);
      expect(money.amount).toBe(19.99);
      expect(money.currency).toBe("EUR");
    });

    it("should create zero Money", () => {
      const zero = Money.zero("EUR");
      expect(zero.amount).toBe(0);
      expect(zero.cents).toBe(0);
      expect(zero.currency).toBe("EUR");
      expect(zero.isZero()).toBe(true);
      expect(zero.isPositive()).toBe(false);
    });

    it("should normalize lowercase currency to uppercase and trim whitespace", () => {
      const money = new Money(100, " eur ");
      expect(money.currency).toBe("EUR");
    });

    it("should throw an error for negative amount", () => {
      expect(() => new Money(-10)).toThrow(
        "Invalid money amount: amount must be a non-negative number",
      );
      expect(() => Money.fromCents(-100)).toThrow(
        "Invalid money cents: must be a non-negative integer",
      );
    });

    it("should throw an error for NaN or non-finite amount", () => {
      expect(() => new Money(NaN)).toThrow(
        "Invalid money amount: amount must be a non-negative number",
      );
      expect(() => new Money(Infinity)).toThrow(
        "Invalid money amount: amount must be a non-negative number",
      );
      expect(() => new Money(-Infinity)).toThrow(
        "Invalid money amount: amount must be a non-negative number",
      );
    });

    it("should throw an error for invalid currency code", () => {
      expect(() => new Money(100, "")).toThrow(
        "Invalid currency code: must be a 3-letter ISO currency code",
      );
      expect(() => new Money(100, "US")).toThrow(
        "Invalid currency code: must be a 3-letter ISO currency code",
      );
      expect(() => new Money(100, "EUROPE")).toThrow(
        "Invalid currency code: must be a 3-letter ISO currency code",
      );
      expect(() => new Money(100, "123")).toThrow(
        "Invalid currency code: must be a 3-letter ISO currency code",
      );
    });
  });

  describe("Parsing String and Locale Formats", () => {
    it("should parse simple decimal string with EUR symbol", () => {
      const money = Money.parse("€45.00");
      expect(money.cents).toBe(4500);
      expect(money.amount).toBe(45);
      expect(money.currency).toBe("EUR");
    });

    it("should parse USD string with dollar sign", () => {
      const money = Money.parse("$30.50");
      expect(money.cents).toBe(3050);
      expect(money.amount).toBe(30.5);
      expect(money.currency).toBe("USD");
    });

    it("should parse Turkish Lira with European thousands and comma decimals", () => {
      const money = Money.parse("₺1.500,50");
      expect(money.cents).toBe(150050);
      expect(money.amount).toBe(1500.5);
      expect(money.currency).toBe("TRY");
    });

    it("should parse European format with trailing currency suffix (45,50 €)", () => {
      const money = Money.parse("45,50 €");
      expect(money.cents).toBe(4550);
      expect(money.amount).toBe(45.5);
      expect(money.currency).toBe("EUR");
    });

    it("should return zero on empty or invalid string", () => {
      const money = Money.parse("");
      expect(money.isZero()).toBe(true);
      expect(money.currency).toBe("EUR");
    });
  });

  describe("Comparisons and Predicates", () => {
    it("should check value equality with equals()", () => {
      const a = new Money(150, "EUR");
      const b = Money.fromCents(15000, "EUR");
      const c = new Money(200, "EUR");
      const d = new Money(150, "USD");

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(d)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals(undefined)).toBe(false);
    });

    it("should compare greaterThan and greaterThanOrEqual", () => {
      const low = new Money(50, "EUR");
      const high = new Money(100, "EUR");
      const equal = new Money(100, "EUR");

      expect(high.greaterThan(low)).toBe(true);
      expect(high.isGreaterThan(low)).toBe(true);
      expect(low.greaterThan(high)).toBe(false);
      expect(high.greaterThanOrEqual(equal)).toBe(true);
      expect(low.greaterThanOrEqual(high)).toBe(false);

      expect(() => high.greaterThan(new Money(50, "USD"))).toThrow(
        "Currency mismatch",
      );
    });

    it("should compare lessThan and lessThanOrEqual", () => {
      const low = new Money(50, "EUR");
      const high = new Money(100, "EUR");
      const equal = new Money(50, "EUR");

      expect(low.lessThan(high)).toBe(true);
      expect(low.isLessThan(high)).toBe(true);
      expect(high.lessThan(low)).toBe(false);
      expect(low.lessThanOrEqual(equal)).toBe(true);
      expect(high.lessThanOrEqual(low)).toBe(false);
    });

    it("should correctly identify positive and zero", () => {
      expect(new Money(10, "EUR").isPositive()).toBe(true);
      expect(Money.zero("EUR").isPositive()).toBe(false);
      expect(Money.zero("EUR").isZero()).toBe(true);
    });
  });

  describe("Arithmetic Operations & Zero Float Drift", () => {
    it("should add accurately without floating point drift (0.1 + 0.2 === 0.3)", () => {
      const a = new Money(0.1, "EUR");
      const b = new Money(0.2, "EUR");
      const result = a.add(b);

      expect(result.amount).toBe(0.3);
      expect(result.cents).toBe(30);
      expect(result.currency).toBe("EUR");
      expect(a.cents).toBe(10);
      expect(b.cents).toBe(20);
    });

    it("should throw when adding different currencies", () => {
      const eur = new Money(100, "EUR");
      const usd = new Money(100, "USD");
      expect(() => eur.add(usd)).toThrow("Currency mismatch");
    });

    it("should subtract accurately and throw when negative", () => {
      const a = new Money(100, "EUR");
      const b = new Money(40, "EUR");
      const result = a.subtract(b);

      expect(result.amount).toBe(60);
      expect(result.cents).toBe(6000);

      expect(() => b.subtract(a)).toThrow(
        "Invalid money operation: result cannot be negative",
      );
    });

    it("should multiply by scalar factor with round-half-up precision", () => {
      const money = new Money(19.99, "USD");
      const result = money.multiply(3);

      expect(result.amount).toBe(59.97);
      expect(result.cents).toBe(5997);
    });

    it("should calculate percentage accurately", () => {
      const money = Money.fromCents(1999, "EUR"); // €19.99
      const vat = money.percentage(18); // 18% VAT: 1999 * 0.18 = 359.82 -> 360 cents
      expect(vat.cents).toBe(360);
      expect(vat.amount).toBe(3.6);
    });

    it("should add tax correctly", () => {
      const net = new Money(100, "EUR");
      const gross = net.addTax(20); // 20% tax
      expect(gross.amount).toBe(120);
      expect(gross.cents).toBe(12000);
    });

    it("should apply discount as percentage or direct Money instance", () => {
      const price = new Money(100, "EUR");
      const discountedByPercent = price.applyDiscount(15); // 15% discount
      expect(discountedByPercent.amount).toBe(85);

      const discountedByMoney = price.applyDiscount(new Money(25, "EUR"));
      expect(discountedByMoney.amount).toBe(75);
    });

    it("should allocate amounts proportionally without losing remainder cents", () => {
      const total = new Money(10, "EUR"); // 1000 cents split 3 ways [1, 1, 1]
      const shares = total.allocate([1, 1, 1]);

      expect(shares.length).toBe(3);
      expect(shares[0].cents).toBe(334);
      expect(shares[1].cents).toBe(333);
      expect(shares[2].cents).toBe(333);

      const sum = shares.reduce((acc, s) => acc + s.cents, 0);
      expect(sum).toBe(1000);
    });
  });

  describe("Multi-Currency Conversion", () => {
    it("should convert using direct exchange rate pair", () => {
      const eur = new Money(100, "EUR");
      const rates = { EUR_TRY: 37.5, EUR_USD: 1.08 };
      const tryMoney = eur.convert("TRY", rates);

      expect(tryMoney.currency).toBe("TRY");
      expect(tryMoney.amount).toBe(3750);
      expect(tryMoney.cents).toBe(375000);
    });

    it("should convert using inverse exchange rate pair if direct not present", () => {
      const tryMoney = new Money(3750, "TRY");
      const rates = { EUR_TRY: 37.5 };
      const eurMoney = tryMoney.convert("EUR", rates);

      expect(eurMoney.currency).toBe("EUR");
      expect(eurMoney.amount).toBe(100);
      expect(eurMoney.cents).toBe(10000);
    });

    it("should return same instance if converting to same currency", () => {
      const eur = new Money(100, "EUR");
      expect(eur.convert("EUR", {})).toBe(eur);
    });

    it("should throw error when exchange rate is missing", () => {
      const eur = new Money(100, "EUR");
      expect(() => eur.convert("JPY", {})).toThrow("Exchange rate not found");
    });
  });

  describe("Formatting and Serialization", () => {
    it("should format money with standard format()", () => {
      const money = new Money(150, "EUR");
      expect(money.format()).toBe("150.00 EUR");
    });

    it("should convert to database decimal", () => {
      const money = Money.fromCents(4990, "USD");
      expect(money.toDatabaseDecimal()).toBe(49.9);
    });

    it("should serialize to JSON with cents, amount, currency, and formatted", () => {
      const money = new Money(99.5, "TRY");
      const json = money.toJSON();

      expect(json).toEqual({
        cents: 9950,
        amount: 99.5,
        currency: "TRY",
        formatted: "99.50 TRY",
      });
    });

    it("should deserialize from JSON object", () => {
      const fromCentsObj = Money.fromJSON({ cents: 2500, currency: "USD" });
      expect(fromCentsObj.amount).toBe(25);
      expect(fromCentsObj.currency).toBe("USD");

      const fromAmountObj = Money.fromJSON({ amount: 19.99, currency: "EUR" });
      expect(fromAmountObj.cents).toBe(1999);
      expect(fromAmountObj.currency).toBe("EUR");
    });
  });
});

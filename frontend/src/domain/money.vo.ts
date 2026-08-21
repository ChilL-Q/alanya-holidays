export interface IMoneyJson {
  cents: number;
  amount: number;
  currency: string;
  formatted: string;
}

export type ExchangeRates = Record<string, number>;

/**
 * Money Value Object (Frontend)
 * Represents an immutable monetary amount with currency stored in base units (integer cents).
 * Eliminates IEEE 754 floating-point drift.
 */
export class Money {
  private readonly _cents: number;
  private readonly _currency: string;

  constructor(amount: number, currency: string = "EUR") {
    if (
      typeof amount !== "number" ||
      isNaN(amount) ||
      !isFinite(amount) ||
      amount < 0
    ) {
      throw new Error(
        "Invalid money amount: amount must be a non-negative number",
      );
    }

    if (
      typeof currency !== "string" ||
      currency.trim().length !== 3 ||
      !/^[A-Za-z]{3}$/.test(currency.trim())
    ) {
      throw new Error(
        "Invalid currency code: must be a 3-letter ISO currency code",
      );
    }

    this._cents = Math.round(amount * 100);
    this._currency = currency.trim().toUpperCase();
  }

  get cents(): number {
    return this._cents;
  }

  get amount(): number {
    return this._cents / 100;
  }

  get currency(): string {
    return this._currency;
  }

  // --- Static Factories ---

  /**
   * Creates a Money instance from base units (cents).
   */
  static fromCents(cents: number, currency: string = "EUR"): Money {
    if (
      typeof cents !== "number" ||
      !Number.isInteger(cents) ||
      isNaN(cents) ||
      !isFinite(cents) ||
      cents < 0
    ) {
      throw new Error(
        `Invalid money cents: must be a non-negative integer, got ${cents}`,
      );
    }

    const money = new Money(0, currency);
    (money as unknown as { _cents: number })._cents = cents;
    return money;
  }

  /**
   * Creates a Money instance from a decimal amount or parses a formatted string.
   */
  static fromDecimal(amount: number | string, currency: string = "EUR"): Money {
    if (typeof amount === "string") {
      return Money.parse(amount, currency);
    }
    return new Money(amount, currency);
  }

  /**
   * Alias factory for backwards compatibility.
   */
  static from(amount: number, currency = "EUR"): Money {
    return new Money(amount, currency);
  }

  /**
   * Factory method to create zero Money.
   */
  static zero(currency = "EUR"): Money {
    return Money.fromCents(0, currency);
  }

  /**
   * Parses string formats with currency symbols and European/Turkish decimals.
   */
  static parse(value: string | number, fallbackCurrency = "EUR"): Money {
    if (typeof value === "number") {
      return Money.fromDecimal(value, fallbackCurrency);
    }

    if (!value || typeof value !== "string") {
      return Money.zero(fallbackCurrency);
    }

    let detectedCurrency = fallbackCurrency;
    if (value.includes("€") || /EUR/i.test(value)) detectedCurrency = "EUR";
    else if (value.includes("$") || /USD/i.test(value)) detectedCurrency = "USD";
    else if (value.includes("₺") || /TRY|TL/i.test(value)) detectedCurrency = "TRY";

    let cleaned = value.replace(/[^0-9.,]/g, "").trim();
    if (!cleaned) {
      return Money.zero(detectedCurrency);
    }

    if (cleaned.includes(",") && cleaned.includes(".")) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        // European style 1.500,50 -> 1500.50
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        // Standard style 1,500.50 -> 1500.50
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.includes(",")) {
      cleaned = cleaned.replace(",", ".");
    }

    const parsedNum = parseFloat(cleaned);
    if (isNaN(parsedNum) || !isFinite(parsedNum) || parsedNum < 0) {
      return Money.zero(detectedCurrency);
    }

    return Money.fromDecimal(parsedNum, detectedCurrency);
  }

  /**
   * Deserializes Money from a JSON object.
   */
  static fromJSON(json: {
    cents?: number;
    amount?: number;
    currency?: string;
  }): Money {
    const currency = json?.currency || "EUR";
    if (typeof json?.cents === "number") {
      return Money.fromCents(json.cents, currency);
    }
    if (typeof json?.amount === "number") {
      return Money.fromDecimal(json.amount, currency);
    }
    return Money.zero(currency);
  }

  // --- Arithmetic Operations ---

  /**
   * Adds another Money instance to this one.
   */
  add(other: Money): Money {
    this.assertSameCurrency(other, "add");
    return Money.fromCents(this._cents + other.cents, this._currency);
  }

  /**
   * Subtracts another Money instance from this one.
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other, "subtract");
    if (this._cents < other.cents) {
      throw new Error(
        "Invalid money operation: result cannot be negative",
      );
    }
    return Money.fromCents(this._cents - other.cents, this._currency);
  }

  /**
   * Multiplies the monetary amount by a scalar factor with Round-Half-Up integer cents.
   */
  multiply(factor: number): Money {
    if (
      typeof factor !== "number" ||
      isNaN(factor) ||
      !isFinite(factor) ||
      factor < 0
    ) {
      throw new Error("Invalid multiplier: must be a non-negative number");
    }

    return Money.fromCents(Math.round(this._cents * factor), this._currency);
  }

  /**
   * Calculates a percentage of this money amount (e.g. 18% VAT).
   */
  percentage(rate: number): Money {
    if (
      typeof rate !== "number" ||
      isNaN(rate) ||
      !isFinite(rate) ||
      rate < 0
    ) {
      throw new Error(`Invalid percentage rate: ${rate}`);
    }

    return Money.fromCents(
      Math.round((this._cents * rate) / 100),
      this._currency,
    );
  }

  /**
   * Adds tax percentage to this money amount.
   */
  addTax(taxPercentage: number): Money {
    return this.add(this.percentage(taxPercentage));
  }

  /**
   * Applies discount either as percentage or direct Money deduction.
   */
  applyDiscount(percentOrAmount: number | Money): Money {
    if (percentOrAmount instanceof Money) {
      return this.subtract(percentOrAmount);
    }
    return this.subtract(this.percentage(percentOrAmount));
  }

  /**
   * Allocates this monetary amount among proportional ratios without losing remainder cents.
   */
  allocate(ratios: number[]): Money[] {
    if (!ratios || ratios.length === 0) return [];
    const totalRatio = ratios.reduce((a, b) => a + b, 0);
    if (totalRatio <= 0) {
      throw new Error("Total ratio must be positive");
    }

    let remainder = this._cents;
    const results: Money[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const share = Math.floor((this._cents * ratios[i]) / totalRatio);
      results.push(Money.fromCents(share, this._currency));
      remainder -= share;
    }

    for (let i = 0; i < remainder; i++) {
      results[i] = Money.fromCents(results[i].cents + 1, this._currency);
    }

    return results;
  }

  // --- Currency Conversion ---

  /**
   * Converts Money to target currency using provided exchange rate table.
   */
  convert(targetCurrency: string, rates: ExchangeRates = {}): Money {
    const target = targetCurrency.trim().toUpperCase();
    if (this._currency === target) return this;

    const directPair = `${this._currency}_${target}`;
    const inversePair = `${target}_${this._currency}`;

    let rate: number | undefined = rates[directPair];
    if (
      rate === undefined &&
      rates[inversePair] !== undefined &&
      rates[inversePair] > 0
    ) {
      rate = 1 / rates[inversePair];
    }

    if (rate === undefined || rate <= 0) {
      throw new Error(
        `Exchange rate not found for pair ${this._currency} -> ${target}`,
      );
    }

    const convertedCents = Math.round(this._cents * rate);
    return Money.fromCents(convertedCents, target);
  }

  // --- Comparisons ---

  /**
   * Checks value equality between two Money instances.
   */
  equals(other: unknown): boolean {
    if (!(other instanceof Money)) {
      return false;
    }

    return this._cents === other.cents && this._currency === other.currency;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other, "compare");
    return this._cents > other.cents;
  }

  isGreaterThan(other: Money): boolean {
    return this.greaterThan(other);
  }

  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other, "compare");
    return this._cents >= other.cents;
  }

  lessThan(other: Money): boolean {
    this.assertSameCurrency(other, "compare");
    return this._cents < other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.lessThan(other);
  }

  lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other, "compare");
    return this._cents <= other.cents;
  }

  isZero(): boolean {
    return this._cents === 0;
  }

  isPositive(): boolean {
    return this._cents > 0;
  }

  // --- Formatting and Serialization ---

  /**
   * Formats the monetary amount as a standard string representation.
   */
  format(): string {
    return `${this.amount.toFixed(2)} ${this._currency}`;
  }

  /**
   * Returns decimal representation for database or API payloads.
   */
  toDatabaseDecimal(): number {
    return this.amount;
  }

  /**
   * Serializes to JSON.
   */
  toJSON(): IMoneyJson {
    return {
      cents: this._cents,
      amount: this.amount,
      currency: this._currency,
      formatted: this.format(),
    };
  }

  private assertSameCurrency(
    other: Money,
    operation: "add" | "subtract" | "compare",
  ): void {
    if (!other || typeof other.currency !== "string") {
      throw new Error(`Invalid money instance for ${operation}`);
    }

    if (this._currency !== other.currency) {
      if (operation === "add") {
        throw new Error(
          `Currency mismatch: cannot add ${other.currency} to ${this._currency}`,
        );
      }
      if (operation === "subtract") {
        throw new Error(
          `Currency mismatch: cannot subtract ${other.currency} from ${this._currency}`,
        );
      }
      throw new Error(
        `Currency mismatch: cannot compare ${other.currency} with ${this._currency}`,
      );
    }
  }
}

/**
 * Money Value Object
 * Represents an immutable monetary amount with currency.
 * Zero external framework dependencies.
 */
export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  constructor(amount: number, currency: string = 'EUR') {
    if (
      typeof amount !== 'number' ||
      isNaN(amount) ||
      !isFinite(amount) ||
      amount < 0
    ) {
      throw new Error(
        'Invalid money amount: amount must be a non-negative number',
      );
    }

    if (
      typeof currency !== 'string' ||
      currency.trim().length !== 3 ||
      !/^[A-Za-z]{3}$/.test(currency.trim())
    ) {
      throw new Error(
        'Invalid currency code: must be a 3-letter ISO currency code',
      );
    }

    this._amount = amount;
    this._currency = currency.trim().toUpperCase();
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  /**
   * Checks value equality between two Money instances.
   */
  equals(other: Money): boolean {
    if (
      !other ||
      typeof other.amount !== 'number' ||
      typeof other.currency !== 'string'
    ) {
      return false;
    }

    return this._amount === other.amount && this._currency === other.currency;
  }

  /**
   * Adds another Money instance to this one.
   * Throws if currencies do not match.
   */
  add(other: Money): Money {
    if (this._currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot add ${other.currency} to ${this._currency}`,
      );
    }

    const newAmount = Math.round((this._amount + other.amount) * 10000) / 10000;
    return new Money(newAmount, this._currency);
  }

  /**
   * Subtracts another Money instance from this one.
   * Throws if currencies do not match or if result would be negative.
   */
  subtract(other: Money): Money {
    if (this._currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot subtract ${other.currency} from ${this._currency}`,
      );
    }

    const newAmount = Math.round((this._amount - other.amount) * 10000) / 10000;

    if (newAmount < 0) {
      throw new Error('Invalid money amount: result cannot be negative');
    }

    return new Money(newAmount, this._currency);
  }

  /**
   * Multiplies the monetary amount by a scalar factor.
   * Throws if factor is not a non-negative finite number.
   */
  multiply(factor: number): Money {
    if (
      typeof factor !== 'number' ||
      isNaN(factor) ||
      !isFinite(factor) ||
      factor < 0
    ) {
      throw new Error('Invalid multiplier: must be a non-negative number');
    }

    const newAmount = Math.round(this._amount * factor * 10000) / 10000;
    return new Money(newAmount, this._currency);
  }

  /**
   * Formats the monetary amount as a standard string representation.
   */
  format(): string {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }

  /**
   * Factory method to create a Money instance.
   */
  static from(amount: number, currency = 'EUR'): Money {
    return new Money(amount, currency);
  }

  /**
   * Factory method to create zero Money.
   */
  static zero(currency = 'EUR'): Money {
    return new Money(0, currency);
  }
}

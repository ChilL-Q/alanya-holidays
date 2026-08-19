/**
 * ReviewRating Value Object
 * Represents an immutable review rating between 1 and 5 in increments of 0.5.
 * Zero external framework dependencies.
 */
export class ReviewRating {
  private readonly _value: number;

  constructor(value: number) {
    if (!ReviewRating.isValid(value)) {
      throw new Error(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
    }

    this._value = Math.round(value * 10) / 10;
  }

  get value(): number {
    return this._value;
  }

  /**
   * Checks whether a given numeric value is a valid review rating.
   */
  static isValid(value: number): boolean {
    if (
      typeof value !== 'number' ||
      isNaN(value) ||
      !isFinite(value) ||
      value < 1 ||
      value > 5
    ) {
      return false;
    }

    const doubleValue = Math.round(value * 2 * 1000) / 1000;
    return Math.abs(doubleValue - Math.round(doubleValue)) < 1e-9;
  }

  /**
   * Factory method to instantiate ReviewRating.
   */
  static create(value: number): ReviewRating {
    return new ReviewRating(value);
  }

  /**
   * Checks value equality between two ReviewRating instances.
   */
  equals(other: ReviewRating): boolean {
    if (!other || typeof other.value !== 'number') {
      return false;
    }

    return this._value === other.value;
  }

  /**
   * Formats rating into a human-readable display string.
   */
  format(): string {
    return `${this._value} / 5`;
  }

  /**
   * Checks if this is a top/perfect 5-star rating.
   */
  isPerfect(): boolean {
    return this._value === 5;
  }
}

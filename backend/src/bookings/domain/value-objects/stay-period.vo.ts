/**
 * StayPeriod Value Object
 * Represents an immutable stay duration defined by check-in and check-out dates.
 * Zero external framework dependencies.
 */
export class StayPeriod {
  private readonly _checkIn: string;
  private readonly _checkOut: string;

  constructor(checkIn: string, checkOut: string) {
    if (
      typeof checkIn !== 'string' ||
      typeof checkOut !== 'string' ||
      isNaN(new Date(checkIn).getTime()) ||
      isNaN(new Date(checkOut).getTime())
    ) {
      throw new Error(
        'Invalid stay period: check-in and check-out must be valid ISO date strings',
      );
    }

    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();

    if (outTime <= inTime) {
      throw new Error(
        'Invalid stay period: check-out date must be strictly after check-in date',
      );
    }

    this._checkIn = checkIn;
    this._checkOut = checkOut;
  }

  get checkIn(): string {
    return this._checkIn;
  }

  get checkOut(): string {
    return this._checkOut;
  }

  /**
   * Calculates total positive nights between checkIn and checkOut.
   */
  getNightsCount(): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff =
      new Date(this._checkOut).getTime() - new Date(this._checkIn).getTime();
    return Math.round(diff / msPerDay);
  }

  /**
   * Checks if this stay period overlaps with another stay period.
   * Two periods overlap if this.checkIn < other.checkOut && this.checkOut > other.checkIn.
   */
  overlapsWith(other: StayPeriod): boolean {
    if (!other) {
      return false;
    }
    const thisIn = new Date(this._checkIn).getTime();
    const thisOut = new Date(this._checkOut).getTime();
    const otherIn = new Date(other.checkIn).getTime();
    const otherOut = new Date(other.checkOut).getTime();

    return thisIn < otherOut && thisOut > otherIn;
  }

  /**
   * Checks if a given date falls within the stay period (inclusive check-in, exclusive check-out).
   */
  containsDate(dateStr: string): boolean {
    if (typeof dateStr !== 'string' || isNaN(new Date(dateStr).getTime())) {
      throw new Error('Invalid date string provided for containment check');
    }

    const targetTime = new Date(dateStr).getTime();
    const inTime = new Date(this._checkIn).getTime();
    const outTime = new Date(this._checkOut).getTime();

    return targetTime >= inTime && targetTime < outTime;
  }

  /**
   * Checks value equality between two StayPeriod instances.
   */
  equals(other: StayPeriod): boolean {
    if (
      !other ||
      typeof other.checkIn !== 'string' ||
      typeof other.checkOut !== 'string'
    ) {
      return false;
    }

    return (
      new Date(this._checkIn).getTime() === new Date(other.checkIn).getTime() &&
      new Date(this._checkOut).getTime() === new Date(other.checkOut).getTime()
    );
  }

  /**
   * Serializes the stay period to standard ISO strings.
   */
  toISOStrings(): { checkIn: string; checkOut: string } {
    return {
      checkIn: this._checkIn,
      checkOut: this._checkOut,
    };
  }
}

import { StayPeriod, Money } from '../value-objects';

export type BookingStatus =
  'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';

export type BookingItemType = 'property' | 'service';

export interface CreateBookingProps {
  itemId: string;
  itemType: BookingItemType;
  guestId: string;
  stayPeriod: StayPeriod;
  totalPrice: Money;
  guestsCount: number;
  message?: string;
  paymentMethod?: string;
}

export interface RestoreBookingProps {
  id: string;
  itemId: string;
  itemType: BookingItemType;
  guestId: string;
  stayPeriod: StayPeriod;
  totalPrice: Money;
  status: BookingStatus;
  guestsCount: number;
  message?: string;
  paymentMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Rich Domain Entity representing a Booking with business invariants.
 * Zero external framework dependencies.
 */
export class BookingEntity {
  private readonly _id?: string;
  private readonly _itemId: string;
  private readonly _itemType: BookingItemType;
  private readonly _guestId: string;
  private readonly _stayPeriod: StayPeriod;
  private readonly _totalPrice: Money;
  private _status: BookingStatus;
  private readonly _guestsCount: number;
  private readonly _message?: string;
  private readonly _paymentMethod?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id?: string;
    itemId: string;
    itemType: BookingItemType;
    guestId: string;
    stayPeriod: StayPeriod;
    totalPrice: Money;
    status: BookingStatus;
    guestsCount: number;
    message?: string;
    paymentMethod?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._itemId = props.itemId;
    this._itemType = props.itemType;
    this._guestId = props.guestId;
    this._stayPeriod = props.stayPeriod;
    this._totalPrice = props.totalPrice;
    this._status = props.status;
    this._guestsCount = props.guestsCount;
    this._message = props.message;
    this._paymentMethod = props.paymentMethod;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }

  get itemId(): string {
    return this._itemId;
  }

  get itemType(): BookingItemType {
    return this._itemType;
  }

  get guestId(): string {
    return this._guestId;
  }

  get stayPeriod(): StayPeriod {
    return this._stayPeriod;
  }

  get totalPrice(): Money {
    return this._totalPrice;
  }

  get status(): BookingStatus {
    return this._status;
  }

  get guestsCount(): number {
    return this._guestsCount;
  }

  get message(): string | undefined {
    return this._message;
  }

  get paymentMethod(): string | undefined {
    return this._paymentMethod;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Factory method to create a new Booking in 'pending' status.
   */
  static create(props: CreateBookingProps): BookingEntity {
    if (
      !props.itemId ||
      typeof props.itemId !== 'string' ||
      props.itemId.trim() === ''
    ) {
      throw new Error('Invalid booking: itemId is required');
    }

    if (
      !props.guestId ||
      typeof props.guestId !== 'string' ||
      props.guestId.trim() === ''
    ) {
      throw new Error('Invalid booking: guestId is required');
    }

    if (props.itemType !== 'property' && props.itemType !== 'service') {
      throw new Error(
        'Invalid booking: itemType must be either property or service',
      );
    }

    if (!props.stayPeriod || !(props.stayPeriod instanceof StayPeriod)) {
      throw new Error('Invalid booking: valid StayPeriod is required');
    }

    if (!props.totalPrice || !(props.totalPrice instanceof Money)) {
      throw new Error('Invalid booking: valid totalPrice Money is required');
    }

    if (
      typeof props.guestsCount !== 'number' ||
      isNaN(props.guestsCount) ||
      !Number.isInteger(props.guestsCount) ||
      props.guestsCount < 1
    ) {
      throw new Error(
        'Invalid booking: guestsCount must be a positive integer',
      );
    }

    const now = new Date();

    return new BookingEntity({
      itemId: props.itemId.trim(),
      itemType: props.itemType,
      guestId: props.guestId.trim(),
      stayPeriod: props.stayPeriod,
      totalPrice: props.totalPrice,
      status: 'pending',
      guestsCount: props.guestsCount,
      message: props.message?.trim(),
      paymentMethod: props.paymentMethod?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing BookingEntity from persistent storage.
   */
  static restore(props: RestoreBookingProps): BookingEntity {
    if (!props.id || typeof props.id !== 'string' || props.id.trim() === '') {
      throw new Error('Invalid restore: id is required');
    }

    if (
      !props.itemId ||
      typeof props.itemId !== 'string' ||
      props.itemId.trim() === ''
    ) {
      throw new Error('Invalid booking: itemId is required');
    }

    if (
      !props.guestId ||
      typeof props.guestId !== 'string' ||
      props.guestId.trim() === ''
    ) {
      throw new Error('Invalid booking: guestId is required');
    }

    if (props.itemType !== 'property' && props.itemType !== 'service') {
      throw new Error(
        'Invalid booking: itemType must be either property or service',
      );
    }

    if (!props.stayPeriod || !(props.stayPeriod instanceof StayPeriod)) {
      throw new Error('Invalid booking: valid StayPeriod is required');
    }

    if (!props.totalPrice || !(props.totalPrice instanceof Money)) {
      throw new Error('Invalid booking: valid totalPrice Money is required');
    }

    return new BookingEntity({
      id: props.id.trim(),
      itemId: props.itemId.trim(),
      itemType: props.itemType,
      guestId: props.guestId.trim(),
      stayPeriod: props.stayPeriod,
      totalPrice: props.totalPrice,
      status: props.status,
      guestsCount: props.guestsCount,
      message: props.message,
      paymentMethod: props.paymentMethod,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Checks if this booking can be cancelled by the given user.
   * Only the guest who booked can cancel, and cannot cancel if already cancelled, rejected, or completed.
   */
  canBeCancelledBy(userId: string): boolean {
    if (!userId || typeof userId !== 'string') {
      return false;
    }

    return (
      userId === this._guestId &&
      this._status !== 'cancelled' &&
      this._status !== 'rejected' &&
      this._status !== 'completed'
    );
  }

  /**
   * Cancels the booking if invariants are satisfied.
   */
  cancel(byUserId: string): void {
    if (!this.canBeCancelledBy(byUserId)) {
      throw new Error(
        'Booking cannot be cancelled by this user or in current status',
      );
    }

    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  /**
   * Confirms a pending booking.
   */
  confirm(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot confirm booking with status '${this._status}'`);
    }

    this._status = 'confirmed';
    this._updatedAt = new Date();
  }

  /**
   * Rejects a pending booking.
   */
  reject(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot reject booking with status '${this._status}'`);
    }

    this._status = 'rejected';
    this._updatedAt = new Date();
  }

  /**
   * Marks a confirmed booking as completed.
   */
  complete(): void {
    if (this._status !== 'confirmed') {
      throw new Error(`Cannot complete booking with status '${this._status}'`);
    }

    this._status = 'completed';
    this._updatedAt = new Date();
  }

  /**
   * Calculates total nights of stay.
   */
  calculateNights(): number {
    return this._stayPeriod.getNightsCount();
  }

  isPending(): boolean {
    return this._status === 'pending';
  }

  isConfirmed(): boolean {
    return this._status === 'confirmed';
  }

  isCancelled(): boolean {
    return this._status === 'cancelled';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  isCompleted(): boolean {
    return this._status === 'completed';
  }
}

import { Money } from '../../../common/domain/value-objects/money.vo';

export type ServiceOfferingStatus =
  'pending' | 'approved' | 'rejected' | 'archived';

export interface CreateServiceOfferingProps {
  title: string;
  type: string;
  providerId: string;
  price: Money;
  priceUnit?: string;
  capacity?: number;
  location?: string;
  description?: string;
  images?: string[];
  features?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface RestoreServiceOfferingProps {
  id: string;
  title: string;
  type: string;
  providerId: string;
  price: Money;
  priceUnit?: string;
  capacity?: number;
  location?: string;
  description?: string;
  images?: string[];
  features?: Record<string, unknown>;
  details?: Record<string, unknown>;
  serviceRef?: number;
  status: ServiceOfferingStatus;
  rejectionReason?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Rich Domain Entity representing a Service Offering with business invariants.
 * Zero external framework dependencies.
 */
export class ServiceOfferingEntity {
  private readonly _id?: string;
  private readonly _title: string;
  private readonly _type: string;
  private readonly _providerId: string;
  private readonly _price: Money;
  private readonly _priceUnit?: string;
  private readonly _capacity?: number;
  private readonly _location?: string;
  private readonly _description?: string;
  private readonly _images: string[];
  private readonly _features: Record<string, unknown>;
  private readonly _details: Record<string, unknown>;
  private readonly _serviceRef?: number;
  private _status: ServiceOfferingStatus;
  private _rejectionReason?: string;
  private readonly _rating?: number;
  private readonly _reviewCount?: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id?: string;
    title: string;
    type: string;
    providerId: string;
    price: Money;
    priceUnit?: string;
    capacity?: number;
    location?: string;
    description?: string;
    images?: string[];
    features?: Record<string, unknown>;
    details?: Record<string, unknown>;
    serviceRef?: number;
    status: ServiceOfferingStatus;
    rejectionReason?: string;
    rating?: number;
    reviewCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._title = props.title;
    this._type = props.type;
    this._providerId = props.providerId;
    this._price = props.price;
    this._priceUnit = props.priceUnit;
    this._capacity = props.capacity;
    this._location = props.location;
    this._description = props.description;
    this._images = props.images ?? [];
    this._features = props.features ?? {};
    this._details = props.details ?? {};
    this._serviceRef = props.serviceRef;
    this._status = props.status;
    this._rejectionReason = props.rejectionReason;
    this._rating = props.rating;
    this._reviewCount = props.reviewCount;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get type(): string {
    return this._type;
  }

  get providerId(): string {
    return this._providerId;
  }

  get price(): Money {
    return this._price;
  }

  get priceUnit(): string | undefined {
    return this._priceUnit;
  }

  get capacity(): number | undefined {
    return this._capacity;
  }

  get location(): string | undefined {
    return this._location;
  }

  get description(): string | undefined {
    return this._description;
  }

  get images(): string[] {
    return [...this._images];
  }

  get features(): Record<string, unknown> {
    return { ...this._features };
  }

  get details(): Record<string, unknown> {
    return { ...this._details };
  }

  get serviceRef(): number | undefined {
    return this._serviceRef;
  }

  get status(): ServiceOfferingStatus {
    return this._status;
  }

  get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  get rating(): number | undefined {
    return this._rating;
  }

  get reviewCount(): number | undefined {
    return this._reviewCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Factory method to create a new ServiceOfferingEntity in 'pending' status.
   */
  static create(props: CreateServiceOfferingProps): ServiceOfferingEntity {
    if (
      !props.title ||
      typeof props.title !== 'string' ||
      props.title.trim() === ''
    ) {
      throw new Error('Invalid service offering: title is required');
    }

    if (
      !props.type ||
      typeof props.type !== 'string' ||
      props.type.trim() === ''
    ) {
      throw new Error('Invalid service offering: type is required');
    }

    if (
      !props.providerId ||
      typeof props.providerId !== 'string' ||
      props.providerId.trim() === ''
    ) {
      throw new Error('Invalid service offering: providerId is required');
    }

    if (!props.price || !(props.price instanceof Money)) {
      throw new Error(
        'Invalid service offering: price must be a valid Money instance',
      );
    }

    if (
      props.capacity !== undefined &&
      props.capacity !== null &&
      (typeof props.capacity !== 'number' ||
        isNaN(props.capacity) ||
        !Number.isInteger(props.capacity) ||
        props.capacity < 0)
    ) {
      throw new Error(
        'Invalid service offering: capacity must be a non-negative integer',
      );
    }

    const now = new Date();

    return new ServiceOfferingEntity({
      title: props.title.trim(),
      type: props.type.trim(),
      providerId: props.providerId.trim(),
      price: props.price,
      priceUnit: props.priceUnit?.trim(),
      capacity: props.capacity,
      location: props.location?.trim(),
      description: props.description?.trim(),
      images: props.images ? [...props.images] : [],
      features: props.features ? { ...props.features } : {},
      details: props.details ? { ...props.details } : {},
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing ServiceOfferingEntity from persistent storage.
   */
  static restore(props: RestoreServiceOfferingProps): ServiceOfferingEntity {
    if (!props.id || typeof props.id !== 'string' || props.id.trim() === '') {
      throw new Error('Invalid restore: id is required');
    }

    if (
      !props.title ||
      typeof props.title !== 'string' ||
      props.title.trim() === ''
    ) {
      throw new Error('Invalid service offering: title is required');
    }

    if (
      !props.type ||
      typeof props.type !== 'string' ||
      props.type.trim() === ''
    ) {
      throw new Error('Invalid service offering: type is required');
    }

    if (
      !props.providerId ||
      typeof props.providerId !== 'string' ||
      props.providerId.trim() === ''
    ) {
      throw new Error('Invalid service offering: providerId is required');
    }

    if (!props.price || !(props.price instanceof Money)) {
      throw new Error(
        'Invalid service offering: price must be a valid Money instance',
      );
    }

    return new ServiceOfferingEntity({
      id: props.id.trim(),
      title: props.title.trim(),
      type: props.type.trim(),
      providerId: props.providerId.trim(),
      price: props.price,
      priceUnit: props.priceUnit?.trim(),
      capacity: props.capacity,
      location: props.location?.trim(),
      description: props.description,
      images: props.images ? [...props.images] : [],
      features: props.features ? { ...props.features } : {},
      details: props.details ? { ...props.details } : {},
      serviceRef: props.serviceRef,
      status: props.status,
      rejectionReason: props.rejectionReason,
      rating: props.rating,
      reviewCount: props.reviewCount,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Checks if this service offering can accommodate the given party size.
   */
  canAccommodateParty(partySize: number): boolean {
    if (typeof partySize !== 'number' || isNaN(partySize) || partySize <= 0) {
      return false;
    }

    if (this._capacity !== undefined && this._capacity > 0) {
      return partySize <= this._capacity;
    }

    return true;
  }

  /**
   * Calculates total cost for the specified number of units (hours, days, persons, etc.).
   */
  calculateCost(units: number): Money {
    if (
      typeof units !== 'number' ||
      isNaN(units) ||
      !isFinite(units) ||
      units <= 0
    ) {
      throw new Error('Invalid units: must be a positive number');
    }

    return this._price.multiply(units);
  }

  /**
   * Approves the service offering and clears rejection reason.
   */
  approve(): void {
    this._status = 'approved';
    this._rejectionReason = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Rejects the service offering with an optional reason.
   */
  reject(reason?: string): void {
    this._status = 'rejected';
    this._rejectionReason = reason;
    this._updatedAt = new Date();
  }

  /**
   * Archives the service offering.
   */
  archive(): void {
    this._status = 'archived';
    this._updatedAt = new Date();
  }

  isApproved(): boolean {
    return this._status === 'approved';
  }

  isPending(): boolean {
    return this._status === 'pending';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  isArchived(): boolean {
    return this._status === 'archived';
  }
}

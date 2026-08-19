import { Money } from '../../../common/domain/value-objects/money.vo';

export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface CreatePropertyProps {
  title: string;
  type: string;
  location: string;
  pricePerNight: Money;
  cleaningFee?: Money;
  minStayNights?: number;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  hostId: string;
  images?: string[];
  amenities?: string[];
  description?: string;
}

export interface RestorePropertyProps {
  id: string;
  title: string;
  type: string;
  location: string;
  pricePerNight: Money;
  cleaningFee?: Money;
  minStayNights?: number;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  hostId: string;
  images?: string[];
  amenities?: string[];
  description?: string;
  status: PropertyStatus;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Rich Domain Entity representing a Property with business invariants.
 * Zero external framework dependencies.
 */
export class PropertyEntity {
  private readonly _id?: string;
  private readonly _title: string;
  private readonly _type: string;
  private readonly _location: string;
  private readonly _pricePerNight: Money;
  private readonly _cleaningFee?: Money;
  private readonly _minStayNights: number;
  private readonly _maxGuests: number;
  private readonly _bedrooms: number;
  private readonly _bathrooms: number;
  private readonly _beds: number;
  private readonly _hostId: string;
  private readonly _images: string[];
  private readonly _amenities: string[];
  private readonly _description?: string;
  private _status: PropertyStatus;
  private _rejectionReason?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id?: string;
    title: string;
    type: string;
    location: string;
    pricePerNight: Money;
    cleaningFee?: Money;
    minStayNights: number;
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    beds: number;
    hostId: string;
    images?: string[];
    amenities?: string[];
    description?: string;
    status: PropertyStatus;
    rejectionReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._title = props.title;
    this._type = props.type;
    this._location = props.location;
    this._pricePerNight = props.pricePerNight;
    this._cleaningFee = props.cleaningFee;
    this._minStayNights = props.minStayNights;
    this._maxGuests = props.maxGuests;
    this._bedrooms = props.bedrooms;
    this._bathrooms = props.bathrooms;
    this._beds = props.beds;
    this._hostId = props.hostId;
    this._images = props.images ?? [];
    this._amenities = props.amenities ?? [];
    this._description = props.description;
    this._status = props.status;
    this._rejectionReason = props.rejectionReason;
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

  get location(): string {
    return this._location;
  }

  get pricePerNight(): Money {
    return this._pricePerNight;
  }

  get cleaningFee(): Money | undefined {
    return this._cleaningFee;
  }

  get minStayNights(): number {
    return this._minStayNights;
  }

  get maxGuests(): number {
    return this._maxGuests;
  }

  get bedrooms(): number {
    return this._bedrooms;
  }

  get bathrooms(): number {
    return this._bathrooms;
  }

  get beds(): number {
    return this._beds;
  }

  get hostId(): string {
    return this._hostId;
  }

  get images(): string[] {
    return [...this._images];
  }

  get amenities(): string[] {
    return [...this._amenities];
  }

  get description(): string | undefined {
    return this._description;
  }

  get status(): PropertyStatus {
    return this._status;
  }

  get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Factory method to create a new PropertyEntity in 'pending' status.
   */
  static create(props: CreatePropertyProps): PropertyEntity {
    if (
      !props.title ||
      typeof props.title !== 'string' ||
      props.title.trim() === ''
    ) {
      throw new Error('Invalid property: title is required');
    }

    if (
      !props.type ||
      typeof props.type !== 'string' ||
      props.type.trim() === ''
    ) {
      throw new Error('Invalid property: type is required');
    }

    if (
      !props.hostId ||
      typeof props.hostId !== 'string' ||
      props.hostId.trim() === ''
    ) {
      throw new Error('Invalid property: hostId is required');
    }

    if (!props.pricePerNight || !(props.pricePerNight instanceof Money)) {
      throw new Error(
        'Invalid property: pricePerNight must be a valid Money instance',
      );
    }

    if (props.cleaningFee && !(props.cleaningFee instanceof Money)) {
      throw new Error(
        'Invalid property: cleaningFee must be a valid Money instance',
      );
    }

    const minStayNights = props.minStayNights ?? 1;
    if (
      typeof minStayNights !== 'number' ||
      isNaN(minStayNights) ||
      !Number.isInteger(minStayNights) ||
      minStayNights < 1
    ) {
      throw new Error(
        'Invalid property: minStayNights must be an integer >= 1',
      );
    }

    const maxGuests = props.maxGuests ?? 1;
    if (
      typeof maxGuests !== 'number' ||
      isNaN(maxGuests) ||
      !Number.isInteger(maxGuests) ||
      maxGuests < 1
    ) {
      throw new Error('Invalid property: maxGuests must be an integer >= 1');
    }

    const bedrooms = props.bedrooms ?? 0;
    if (typeof bedrooms !== 'number' || isNaN(bedrooms) || bedrooms < 0) {
      throw new Error(
        'Invalid property: bedrooms must be a non-negative number',
      );
    }

    const bathrooms = props.bathrooms ?? 0;
    if (typeof bathrooms !== 'number' || isNaN(bathrooms) || bathrooms < 0) {
      throw new Error(
        'Invalid property: bathrooms must be a non-negative number',
      );
    }

    const beds = props.beds ?? 0;
    if (typeof beds !== 'number' || isNaN(beds) || beds < 0) {
      throw new Error('Invalid property: beds must be a non-negative number');
    }

    const now = new Date();

    return new PropertyEntity({
      title: props.title.trim(),
      type: props.type.trim(),
      location: (props.location || '').trim(),
      pricePerNight: props.pricePerNight,
      cleaningFee: props.cleaningFee,
      minStayNights,
      maxGuests,
      bedrooms,
      bathrooms,
      beds,
      hostId: props.hostId.trim(),
      images: props.images ? [...props.images] : [],
      amenities: props.amenities ? [...props.amenities] : [],
      description: props.description?.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing PropertyEntity from persistent storage.
   */
  static restore(props: RestorePropertyProps): PropertyEntity {
    if (!props.id || typeof props.id !== 'string' || props.id.trim() === '') {
      throw new Error('Invalid restore: id is required');
    }

    if (
      !props.title ||
      typeof props.title !== 'string' ||
      props.title.trim() === ''
    ) {
      throw new Error('Invalid property: title is required');
    }

    if (
      !props.type ||
      typeof props.type !== 'string' ||
      props.type.trim() === ''
    ) {
      throw new Error('Invalid property: type is required');
    }

    if (
      !props.hostId ||
      typeof props.hostId !== 'string' ||
      props.hostId.trim() === ''
    ) {
      throw new Error('Invalid property: hostId is required');
    }

    if (!props.pricePerNight || !(props.pricePerNight instanceof Money)) {
      throw new Error(
        'Invalid property: pricePerNight must be a valid Money instance',
      );
    }

    if (props.cleaningFee && !(props.cleaningFee instanceof Money)) {
      throw new Error(
        'Invalid property: cleaningFee must be a valid Money instance',
      );
    }

    return new PropertyEntity({
      id: props.id.trim(),
      title: props.title.trim(),
      type: props.type.trim(),
      location: (props.location || '').trim(),
      pricePerNight: props.pricePerNight,
      cleaningFee: props.cleaningFee,
      minStayNights: props.minStayNights ?? 1,
      maxGuests: props.maxGuests ?? 1,
      bedrooms: props.bedrooms ?? 0,
      bathrooms: props.bathrooms ?? 0,
      beds: props.beds ?? 0,
      hostId: props.hostId.trim(),
      images: props.images ? [...props.images] : [],
      amenities: props.amenities ? [...props.amenities] : [],
      description: props.description,
      status: props.status,
      rejectionReason: props.rejectionReason,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Checks if this property can accommodate the specified guest count.
   */
  canAccommodate(guests: number): boolean {
    return (
      typeof guests === 'number' &&
      !isNaN(guests) &&
      guests > 0 &&
      guests <= this._maxGuests
    );
  }

  /**
   * Validates if the stay duration meets minimum nights requirement.
   */
  validateStayDuration(nights: number): boolean {
    return (
      typeof nights === 'number' &&
      !isNaN(nights) &&
      nights >= this._minStayNights
    );
  }

  /**
   * Calculates total price for the specified number of nights.
   */
  calculateTotalPrice(nights: number): Money {
    if (
      typeof nights !== 'number' ||
      isNaN(nights) ||
      !Number.isInteger(nights) ||
      nights < 1
    ) {
      throw new Error('Invalid stay duration: nights must be an integer >= 1');
    }

    const accommodationPrice = this._pricePerNight.multiply(nights);
    if (this._cleaningFee) {
      return accommodationPrice.add(this._cleaningFee);
    }
    return accommodationPrice;
  }

  /**
   * Approves the property and clears rejection reason.
   */
  approve(): void {
    this._status = 'approved';
    this._rejectionReason = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Rejects the property with an optional reason.
   */
  reject(reason?: string): void {
    this._status = 'rejected';
    this._rejectionReason = reason;
    this._updatedAt = new Date();
  }

  /**
   * Archives the property.
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

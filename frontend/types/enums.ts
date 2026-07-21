export enum ServiceType {
  TRANSFER = 'transfer',
  TOUR = 'tour',
  RENTAL = 'rental', // Maybe mapping to 'car' | 'bike'?
  PRODUCT = 'product',
  OTHER = 'other',
  // DB types are lowercase: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer'
  // We should align these.
  CAR = 'car',
  BIKE = 'bike',
  VISA = 'visa',
  ESIM = 'esim'
}

export enum PropertyType {
  VILLA = 'villa',
  APARTMENT = 'apartment'
}

export enum ApprovalStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum RequestType {
  WEEKLY_NORM = 'WEEKLY_NORM',
  TIME_OFF = 'TIME_OFF',
  BUSY_SCHEDULE = 'BUSY_SCHEDULE',
  SUPPORT_TICKET = 'SUPPORT_TICKET',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
}

export enum RequestAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

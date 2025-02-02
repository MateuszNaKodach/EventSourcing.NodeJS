import { PlacedAtWorkStation } from './placeAtWorkStation';
import { ShiftStarted } from './startingShift';
import { TransactionRegistered } from './registeringTransaction';
import { ShiftEnded } from './endingShift';
import { CashRegisterSnapshoted } from './snapshot';
import { aggregateStream } from '#core/streams';

/**
 * System used to key in purchases; also makes mathematical calculations and records payments
 * See more: https://www.englishclub.com/english-for-work/cashier-vocabulary.htm
 */
export type CashRegister = Readonly<{
  id: string;
  /**
   *
   * The amount of money in a cash register or till before and after a person's shift
   * @type {number}
   */
  float: number;

  /**
   * The area where a cashier works
   */
  workstation: string;

  /**
   * Current cashier working on the cash register
   */
  currentCashierId?: string;
}>;

export type CashRegisterEvent =
  | PlacedAtWorkStation
  | ShiftStarted
  | TransactionRegistered
  | ShiftEnded
  | CashRegisterSnapshoted;

export function when(
  currentState: Partial<CashRegister>,
  event: CashRegisterEvent
): Partial<CashRegister> {
  switch (event.type) {
    case 'placed-at-workstation':
      return {
        id: event.data.cashRegisterId,
        workstation: event.data.workstation,
        float: 0,
      };
    case 'shift-started':
      return {
        ...currentState,
        currentCashierId: event.data.cashierId,
      };
    case 'transaction-registered':
      return {
        ...currentState,
        float: (currentState.float ?? 0) + event.data.amount,
      };
    case 'shift-ended':
      return {
        ...currentState,
        currentCashierId: undefined,
      };
    case 'cash-register-snapshoted':
      return {
        ...event.data,
      };
    default:
      // Unexpected event type
      return {
        ...currentState,
      };
  }
}

function isNotEmptyString(value: any): boolean {
  return typeof value === 'string' && value.length > 0;
}

function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value >= 0;
}

export function isCashRegister(
  cashRegister: any
): cashRegister is CashRegister {
  return (
    cashRegister !== undefined &&
    isNotEmptyString(cashRegister.id) &&
    isPositiveNumber(cashRegister.float) &&
    isNotEmptyString(cashRegister.workstation) &&
    (cashRegister.currentCashierId === undefined ||
      isNotEmptyString(cashRegister.currentCashierId))
  );
}

export function isCashRegisterEvent(event: any): event is CashRegisterEvent {
  switch (event.type) {
    case 'placed-at-workstation':
    case 'shift-started':
    case 'transaction-registered':
    case 'shift-ended':
    case 'cash-register-snapshoted':
      return true;
    default:
      return false;
  }
}

export function getCashRegisterStreamName(cashRegisterId: string) {
  return `cashregister-${cashRegisterId}`;
}

export function getCashRegisterFrom(events: CashRegisterEvent[]): CashRegister {
  return aggregateStream(events, when, isCashRegister);
}

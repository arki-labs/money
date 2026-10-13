/**
 * Every failure this package raises on purpose extends `MathError` from
 * `@arki/math`, so one `instanceof MathError` catches both libraries. The
 * money-only failures also extend `MoneyError`. Wrong runtime types (a number
 * where a `Money` was required, or `money + 1`) throw the built-in `TypeError`.
 * Nothing here returns `NaN` or `null` as a hidden failure channel.
 */
import { MathError } from '@arki/math/errors';
export { DivisionByZeroError, EmptyDataError, InvalidArgumentError, MathError, NumberFormatError, NumericRangeError, ResourceLimitError, RoundingNecessaryError, UnsupportedFeatureError, } from '@arki/math/errors';
/** Base class of the failures that only money can have. */
export declare class MoneyError extends MathError {
}
/** Two amounts in different currencies were combined or compared. */
export declare class CurrencyMismatchError extends MoneyError {
    /** Code of the currency on the left-hand side. */
    readonly left: string;
    /** Code of the currency on the right-hand side. */
    readonly right: string;
    constructor(left: string, right: string);
}
/** The code is not in the shipped ISO 4217 table and no custom currency was supplied for it. */
export declare class UnknownCurrencyError extends MoneyError {
    readonly code: string;
    constructor(code: string);
}
/** No exchange rate is known for the pair, or a rate is invalid (zero, negative, conflicting). */
export declare class ExchangeRateError extends MoneyError {
}
/** An amount cannot be expressed in a payment provider's units (fraction it does not accept, wrong step, unsupported currency). */
export declare class ProviderAmountError extends MoneyError {
}
//# sourceMappingURL=errors.d.ts.map
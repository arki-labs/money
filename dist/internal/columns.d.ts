/**
 * The value conversions behind the Drizzle columns, shared by every SQL
 * dialect. Each dialect file only says which column type to declare.
 */
import type { Currency } from '../currency.js';
import type { Money } from '../money.js';
import type { Units } from './units.js';
/** What drivers hand back for an integer column. */
export type IntegerDriverValue = number | bigint | string;
/** Minor units at the column's scale, in canonical form. Throws if the value is in another currency or needs rounding. */
export declare function minorToDriver(value: Money, currency: Currency, scale: number): Units;
/**
 * Reads an integer column. A `number` that is not a safe integer was already
 * rounded by the driver, so it throws instead of becoming a wrong amount.
 */
export declare function minorFromDriver<C extends string>(value: IntegerDriverValue, currency: Currency<C>, scale: number): Money<C>;
/** Exact decimal text at the column's scale. */
export declare function decimalToDriver(value: Money, currency: Currency, scale: number): string;
/** Reads decimal text (or a driver's number for a whole value) at the column's scale. */
export declare function decimalFromDriver<C extends string>(value: string | number, currency: Currency<C>, scale: number): Money<C>;
/** `{ amount, currency }` as JSON text. */
export declare function jsonToDriver(value: Money): string;
/** Reads JSON text, or an object for drivers that parse JSON columns themselves. */
export declare function jsonFromDriver(value: unknown, currencies: readonly Currency[] | undefined): Money;
//# sourceMappingURL=columns.d.ts.map
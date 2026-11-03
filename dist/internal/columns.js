/**
 * The value conversions behind the Drizzle columns, shared by every SQL
 * dialect. Each dialect file only says which column type to declare.
 */
import { InvalidArgumentError, NumericRangeError } from '@arki/math/errors';
import { assertSameCurrency, requireCurrency } from '../currency.js';
import { Money as MoneyClass } from '../money.js';
import { orRaise } from './raise.js';
import { quantize } from './units.js';
/** Minor units at the column's scale, in canonical form. Throws if the value is in another currency or needs rounding. */
export function minorToDriver(value, currency, scale) {
    assertSameCurrency(value.currency, currency);
    return quantize(value.units, value.scale, scale);
}
/**
 * Reads an integer column. A `number` that is not a safe integer was already
 * rounded by the driver, so it throws instead of becoming a wrong amount.
 */
export function minorFromDriver(value, currency, scale) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
        throw new NumericRangeError(`The database driver returned ${value}, which a JavaScript number cannot hold exactly; ` +
            'configure the driver to return big integers as strings or bigint');
    }
    return MoneyClass.fromMinor(typeof value === 'number' || typeof value === 'bigint' ? value : String(value), currency, scale);
}
/** Exact decimal text at the column's scale. */
export function decimalToDriver(value, currency, scale) {
    assertSameCurrency(value.currency, currency);
    return value.toScale(scale).toDecimalString();
}
/** Reads decimal text (or a driver's number for a whole value) at the column's scale. */
export function decimalFromDriver(value, currency, scale) {
    return MoneyClass.of(typeof value === 'number' ? value : String(value), currency, { scale });
}
/** `{ amount, currency }` as JSON text. */
export function jsonToDriver(value) {
    return JSON.stringify(value.toJSON());
}
/**
 * Reads JSON text, or an object for drivers that parse JSON columns themselves.
 * Stored data that is not valid money throws (`SyntaxError`, `InvalidArgumentError`,
 * `UnknownCurrencyError`, `NumberFormatError`), so the query rejects instead of
 * returning a wrong amount: a Drizzle `fromDriver` has no failure channel, and
 * `@arki/db`'s own columns throw on bad stored values the same way.
 */
export function jsonFromDriver(value, currencies) {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (typeof parsed !== 'object' || parsed === null || !('currency' in parsed) || typeof parsed.currency !== 'string') {
        throw new InvalidArgumentError('A money JSON column holds { amount, currency }');
    }
    requireCurrency(parsed.currency, currencies);
    return orRaise(MoneyClass.fromJSON(parsed, currencies));
}
//# sourceMappingURL=columns.js.map
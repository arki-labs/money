/**
 * Drizzle columns for Postgres that read and write `Money`. Optional: needs
 * `drizzle-orm` 1.x installed.
 *
 * - `moneyMinor(name, { currency })` — a `bigint` column of minor units for one
 *   fixed currency ↔ `Money<C>`. Best for sums in SQL.
 * - `moneyDecimal(name, { currency, precision, scale })` — a `numeric` column ↔
 *   `Money<C>`. Readable in SQL tools; holds more decimals than the currency.
 * - `moneyJson(name)` — a `jsonb` column of `{ amount, currency }` ↔ `Money`
 *   in any currency. For prices that vary by row.
 *
 * Every column declares a `:string`-style codec where Drizzle has one, so each
 * driver (node-postgres, postgres.js, PGlite, Bun SQL) hands back text and no
 * value ever passes through a float. Writing a `Money` in another currency, or
 * with more decimals than the column holds, throws instead of storing a wrong
 * value.
 */
import { customType } from 'drizzle-orm/pg-core';
import { assertSameCurrency, resolveCurrency, toCurrency } from './currency.js';
import { InvalidArgumentError } from './errors.js';
import { quantize } from './internal/units.js';
import { Money as MoneyClass } from './money.js';
function requireConfig(config, column) {
    if (config === undefined)
        throw new InvalidArgumentError(`${column} needs a config with a currency`);
    return config;
}
/** Minor units as text, at the column's scale. Throws if the value needs rounding. */
export function moneyToMinorText(value, currency, scale) {
    assertSameCurrency(value.currency, currency);
    return String(quantize(value.units, value.scale, scale));
}
/** `bigint` column ↔ `Money<C>` in one fixed currency. */
export function moneyMinor(name, config) {
    const currency = toCurrency(config.currency);
    const scale = config.scale ?? currency.scale;
    return customType({
        dataType: () => 'bigint',
        codec: 'bigint:string',
        toDriver: value => moneyToMinorText(value, currency, scale),
        fromDriver: text => MoneyClass.fromMinor(String(text), currency, scale),
    })(name, requireConfig(config, 'moneyMinor'));
}
/** `numeric(precision, scale)` column ↔ `Money<C>` in one fixed currency. */
export function moneyDecimal(name, config) {
    const currency = toCurrency(config.currency);
    const scale = config.scale ?? currency.scale;
    const precision = config.precision ?? 19;
    return customType({
        dataType: () => `numeric(${precision}, ${scale})`,
        codec: 'numeric',
        toDriver: value => {
            assertSameCurrency(value.currency, currency);
            return value.toScale(scale).toDecimalString();
        },
        fromDriver: text => MoneyClass.of(String(text), currency, { scale }),
    })(name, requireConfig(config, 'moneyDecimal'));
}
/** `jsonb` column of `{ amount, currency }` ↔ `Money` in any currency. */
export function moneyJson(name, config = {}) {
    return customType({
        dataType: () => 'jsonb',
        toDriver: value => JSON.stringify(value.toJSON()),
        fromDriver: stored => {
            const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
            if (typeof parsed !== 'object' ||
                parsed === null ||
                !('currency' in parsed) ||
                typeof parsed.currency !== 'string') {
                throw new InvalidArgumentError('A moneyJson column holds { amount, currency }');
            }
            resolveCurrency(parsed.currency, config.currencies);
            return MoneyClass.fromJSON(parsed, config.currencies);
        },
    })(name, config);
}
//# sourceMappingURL=drizzle.js.map
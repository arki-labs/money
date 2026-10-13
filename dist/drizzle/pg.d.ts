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
 * The columns declare text codecs, so every driver (node-postgres,
 * postgres.js, PGlite, Bun SQL) hands back text and no value passes through a
 * float. Writing a `Money` in another currency, or with more decimals than the
 * column holds, throws instead of storing a wrong value.
 */
import type { Money } from '../money.js';
import type { MoneyDecimalConfig, MoneyJsonConfig, MoneyMinorConfig } from './config.js';
export type { MoneyDecimalConfig, MoneyJsonConfig, MoneyMinorConfig } from './config.js';
/** `bigint` column ↔ `Money<C>` in one fixed currency. */
export declare function moneyMinor<const C extends string>(name: string, config: MoneyMinorConfig<C>): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<C>;
    driverParam: string;
}>;
/** `numeric(precision, scale)` column ↔ `Money<C>` in one fixed currency. */
export declare function moneyDecimal<const C extends string>(name: string, config: MoneyDecimalConfig<C>): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<C>;
    driverParam: string;
}>;
/** `jsonb` column of `{ amount, currency }` ↔ `Money` in any currency. */
export declare function moneyJson(name: string, config?: MoneyJsonConfig): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<string>;
    driverParam: string;
}>;
//# sourceMappingURL=pg.d.ts.map
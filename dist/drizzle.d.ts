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
import type { Currency, CurrencyLike } from './currency.js';
import type { Money } from './money.js';
export type MoneyMinorConfig<C extends string> = {
    currency: CurrencyLike<C>;
    /** Decimals the stored integer carries. Defaults to the currency's. */
    scale?: number;
};
export type MoneyDecimalConfig<C extends string> = {
    currency: CurrencyLike<C>;
    /** Total digits, as in `numeric(precision, scale)`. Default 19. */
    precision?: number;
    /** Decimals stored. Defaults to the currency's. */
    scale?: number;
};
export type MoneyJsonConfig = {
    /** Custom currencies to resolve by code on read. */
    currencies?: readonly Currency[];
};
/** Minor units as text, at the column's scale. Throws if the value needs rounding. */
export declare function moneyToMinorText(value: Money, currency: Currency, scale: number): string;
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
//# sourceMappingURL=drizzle.d.ts.map
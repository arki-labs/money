/**
 * Drizzle columns for SQLite (libSQL, Turso, better-sqlite3, Bun SQLite,
 * Cloudflare D1, Expo SQLite) that read and write `Money`. Optional: needs
 * `drizzle-orm` 1.x installed.
 *
 * - `moneyMinor(name, { currency })` — an `integer` column of minor units ↔ `Money<C>`.
 * - `moneyDecimal(name, { currency, scale })` — a `text` column of exact decimal
 *   text ↔ `Money<C>`. SQLite has no exact decimal type, so text keeps every digit.
 * - `moneyJson(name)` — a `text` column of `{ amount, currency }` JSON ↔ `Money`.
 *
 * SQLite integers are 64-bit, but most drivers return JavaScript numbers.
 * Amounts up to 2^53 minor units are exact. A bigger stored amount throws on
 * read instead of becoming a wrong value; to read those, switch the driver to
 * big integers (libSQL `intMode: 'bigint'`, better-sqlite3 `safeIntegers()`).
 */
import type { IntegerDriverValue } from '../internal/columns.js';
import type { Money } from '../money.js';
import type { MoneyDecimalConfig, MoneyJsonConfig, MoneyMinorConfig } from './config.js';
export type { MoneyDecimalConfig, MoneyJsonConfig, MoneyMinorConfig } from './config.js';
/** `integer` column ↔ `Money<C>` in one fixed currency. Writes a `bigint` past 2^53. */
export declare function moneyMinor<const C extends string>(name: string, config: MoneyMinorConfig<C>): import("drizzle-orm/sqlite-core").SQLiteCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<C>;
    driverParam: IntegerDriverValue;
}>;
/** `text` column of exact decimal text ↔ `Money<C>` in one fixed currency. */
export declare function moneyDecimal<const C extends string>(name: string, config: MoneyDecimalConfig<C>): import("drizzle-orm/sqlite-core").SQLiteCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<C>;
    driverParam: string;
}>;
/** `text` column of `{ amount, currency }` JSON ↔ `Money` in any currency. */
export declare function moneyJson(name: string, config?: MoneyJsonConfig): import("drizzle-orm/sqlite-core").SQLiteCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<string>;
    driverParam: string;
}>;
//# sourceMappingURL=sqlite.d.ts.map
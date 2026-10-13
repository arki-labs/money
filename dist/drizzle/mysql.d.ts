/**
 * Drizzle columns for MySQL and MariaDB that read and write `Money`.
 * Optional: needs `drizzle-orm` 1.x installed.
 *
 * - `moneyMinor(name, { currency })` — a `bigint` column of minor units ↔ `Money<C>`.
 * - `moneyDecimal(name, { currency, precision, scale })` — a `decimal` column ↔ `Money<C>`.
 * - `moneyJson(name)` — a `json` column of `{ amount, currency }` ↔ `Money` in any currency.
 *
 * `mysql2` returns `DECIMAL` as text and `JSON` as parsed objects by default,
 * and the `bigint` column declares a text codec, so no value passes through a
 * float. If a driver still returns a big integer as an unsafe `number`, reading
 * it throws instead of returning a wrong amount.
 */
import type { IntegerDriverValue } from '../internal/columns.js';
import type { Money } from '../money.js';
import type { MoneyDecimalConfig, MoneyJsonConfig, MoneyMinorConfig } from './config.js';
export type { MoneyDecimalConfig, MoneyJsonConfig, MoneyMinorConfig } from './config.js';
/** `bigint` column ↔ `Money<C>` in one fixed currency. */
export declare function moneyMinor<const C extends string>(name: string, config: MoneyMinorConfig<C>): import("drizzle-orm/mysql-core").MySqlCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<C>;
    driverParam: IntegerDriverValue;
}>;
/** `decimal(precision, scale)` column ↔ `Money<C>` in one fixed currency. */
export declare function moneyDecimal<const C extends string>(name: string, config: MoneyDecimalConfig<C>): import("drizzle-orm/mysql-core").MySqlCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<C>;
    driverParam: string | number;
}>;
/** `json` column of `{ amount, currency }` ↔ `Money` in any currency. */
export declare function moneyJson(name: string, config?: MoneyJsonConfig): import("drizzle-orm/mysql-core").MySqlCustomColumnBuilder<{
    dataType: 'custom';
    data: Money<string>;
    driverParam: unknown;
}>;
//# sourceMappingURL=mysql.d.ts.map
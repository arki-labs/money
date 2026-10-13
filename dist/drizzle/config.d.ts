/** Column options shared by every SQL dialect. */
import type { Currency, CurrencyLike } from '../currency.js';
export type MoneyMinorConfig<C extends string> = {
    currency: CurrencyLike<C>;
    /** Decimals the stored integer carries. Defaults to the currency's. */
    scale?: number;
};
export type MoneyDecimalConfig<C extends string> = {
    currency: CurrencyLike<C>;
    /** Total digits, as in `numeric(precision, scale)`. Default 19. Ignored by SQLite. */
    precision?: number;
    /** Decimals stored. Defaults to the currency's. */
    scale?: number;
};
export type MoneyJsonConfig = {
    /** Custom currencies to resolve by code on read. */
    currencies?: readonly Currency[];
};
/** Validates a column config once, when the table is defined. */
export declare function resolveColumn<C extends string>(config: {
    currency: CurrencyLike<C>;
    scale?: number;
} | undefined, column: string): {
    currency: Currency<C>;
    scale: number;
};
//# sourceMappingURL=config.d.ts.map
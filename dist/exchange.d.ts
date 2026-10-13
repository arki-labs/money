/**
 * Currency conversion with exact rates. A rate is a fraction, never a float:
 * `1 EUR = 1.0832 USD` is stored as `677/625`. Inverse and cross
 * rates stay exact, and a conversion rounds once, at the end.
 *
 * There is no network code. Fetch rates however you like (ECB, a bank, your
 * own table), then build rates from them here.
 *
 * ```ts
 * const converter = createConverter(ratesFrom({ base: 'EUR', rates: { USD: '1.0832', GBP: '0.8571' } }), {
 *   inverse: true,
 *   via: 'EUR',
 * });
 * converter.convert(money(100, 'USD'), 'GBP', { rounding: 'halfEven' }); // USD → EUR → GBP, rounded once
 * ```
 */
import type { CurrencyLike } from './currency.js';
import type { Units } from './internal/units.js';
import type { Amount, MoneyOptions } from './money.js';
import { Currency } from './currency.js';
import { Money } from './money.js';
/** An exact, directed rate: one unit of `base` buys `numerator / denominator` units of `quote`. */
export declare class ExchangeRate<B extends string = string, Q extends string = string> {
    readonly base: Currency<B>;
    readonly quote: Currency<Q>;
    /** Positive, in lowest terms with `denominator`. */
    readonly numerator: Units;
    /** Positive. */
    readonly denominator: Units;
    private constructor();
    /** The reverse rate, exact: `EUR/USD 1.0832` → `USD/EUR 625/677`. */
    inverse(): ExchangeRate<Q, B>;
    /** Chains two rates, exact: `EUR→USD` then `USD→JPY` gives `EUR→JPY`. */
    chain<R extends string>(next: ExchangeRate<Q, R>): ExchangeRate<B, R>;
    /** `true` for the same pair and the same exact value. */
    eq(other: ExchangeRate): boolean;
    /** `'EUR/USD 1.0832'`, or `'USD/EUR 625/677'` when the rate has no finite decimal form. */
    toString(): string;
}
/** `exchangeRate('EUR', 'USD', '1.0832')`: one euro buys 1.0832 dollars. The value must be positive. */
export declare function exchangeRate<const B extends string, const Q extends string>(base: CurrencyLike<B>, quote: CurrencyLike<Q>, value: Amount): ExchangeRate<B, Q>;
/** A table of rates from one base currency, as central banks publish them. */
export type RateTable = {
    base: CurrencyLike;
    /** Quote code → units of that currency one unit of `base` buys. */
    rates: Readonly<Record<string, Amount>>;
    /** Custom currencies used as quote codes. */
    currencies?: readonly Currency[];
};
/** `ratesFrom({ base: 'EUR', rates: { USD: '1.0832' } })` → `[EUR/USD 1.0832]`. */
export declare function ratesFrom(table: RateTable): ExchangeRate[];
/**
 * Converts with one rate. The rate's base must be the amount's currency. The
 * exact result is rounded once to the target scale (the quote currency's,
 * or `options.scale`); an inexact result needs `options.rounding`.
 */
export declare function convert<B extends string, Q extends string>(amount: Money<B>, rate: ExchangeRate<NoInfer<B>, Q>, options?: MoneyOptions): Money<Q>;
export type ConverterOptions = {
    /** Also use `B→A` reversed when only `A→B` is known. Off by default: a bid rate reversed is not an ask rate. */
    inverse?: boolean;
    /** Route through this currency when no direct rate exists: `USD→GBP` as `USD→EUR→GBP`. */
    via?: CurrencyLike;
};
/** A fixed set of rates with lookups. Build it with `createConverter`. Immutable. */
export declare class Converter {
    private readonly rates;
    private readonly inverse;
    private readonly via;
    /** Resolved lookups, including misses. Rates never change, so the cache never goes stale. */
    private readonly resolved;
    constructor(rates: Iterable<ExchangeRate>, options?: ConverterOptions);
    /** The exact rate used for `from → to`. Throws `ExchangeRateError` when none can be found. */
    rate<const F extends string, const T extends string>(from: CurrencyLike<F>, to: CurrencyLike<T>): ExchangeRate<F, T>;
    /** `true` when `rate(from, to)` would succeed. */
    has(from: CurrencyLike, to: CurrencyLike): boolean;
    /** Converts and rounds once. Same-currency conversion needs no rate and only changes the scale. */
    convert<const T extends string>(amount: Money, to: CurrencyLike<T>, options?: MoneyOptions): Money<T>;
    private resolve;
    private lookup;
    private lookupVia;
}
/** `createConverter(rates, { inverse: true, via: 'EUR' })`. */
export declare function createConverter(rates: Iterable<ExchangeRate>, options?: ConverterOptions): Converter;
//# sourceMappingURL=exchange.d.ts.map
/**
 * Currencies. The ISO 4217 list ships with the package, so a currency's number
 * of decimals is the same on every runtime and device. `Intl` is only used for
 * display (see `@arki/money/format`); it accepts made-up codes such as `ZZZ`
 * and its decimals can differ from ISO, so it never decides arithmetic.
 *
 * `Currency.of('EUR')` returns the same object every time, so comparing two
 * currencies is a pointer check on the hot path.
 */
export { ISO_4217_VERSION } from './data/iso4217.js';
/** A currency, or the code of an ISO 4217 currency. */
export type CurrencyLike<C extends string = string> = C | Currency<C>;
/** What `Currency.custom` needs. */
export type CurrencyDefinition<C extends string = string> = {
    /** Letters, digits and `. _ : -`, up to 32 characters, not an ISO 4217 code: `'BTC'`, `'crypto:ETH'`, `'points'`. */
    code: C;
    /** Number of decimals, 0–100: 8 for BTC, 18 for ETH, 0 for loyalty points. */
    scale: number;
    /** Optional three-digit numeric code. */
    numeric?: string;
};
/** An immutable currency: its code, its ISO numeric code and its number of decimals. */
export declare class Currency<C extends string = string> {
    /** `'EUR'`. */
    readonly code: C;
    /** Three-digit ISO numeric code as a string, so `'008'` keeps its zeros. `undefined` for most custom currencies. */
    readonly numeric: string | undefined;
    /** Number of decimals: 2 for EUR, 0 for JPY, 3 for KWD. ISO codes without minor units (XAU, XTS) use 0. */
    readonly scale: number;
    /** `true` for a currency from the shipped ISO 4217 table. */
    readonly iso: boolean;
    private constructor();
    /**
     * The ISO 4217 currency with this upper-case code: `Currency.of('EUR')`.
     * Throws `UnknownCurrencyError` for anything not in the table, including `'eur'`.
     */
    static of<const C extends string>(code: C): Currency<C>;
    /** The ISO 4217 currency with this numeric code: `Currency.fromNumeric('978')` or `(978)` → EUR. */
    static fromNumeric(numeric: string | number): Currency;
    /**
     * A currency that is not in ISO 4217: crypto, loyalty points, a withdrawn
     * currency you still hold data in. It is not registered anywhere; keep the
     * object and pass it where you would pass a code. Two custom currencies with
     * the same code and scale are treated as the same currency.
     */
    static custom<const C extends string>(definition: CurrencyDefinition<C>): Currency<C>;
    /** `true` when `code` is in the shipped ISO 4217 table. */
    static isKnown(code: string): boolean;
    /** Every ISO 4217 code in the shipped table, sorted. */
    static codes(): string[];
    /** Same code and same scale. */
    eq(other: Currency): boolean;
    toString(): C;
    toJSON(): C;
    /** Decodes the packed table on first use. */
    private static table;
}
/** Accepts a `Currency` or an ISO code. */
export declare function toCurrency<C extends string>(currency: CurrencyLike<C>): Currency<C>;
/** Finds a currency by code among `custom`, then in the ISO table. */
export declare function resolveCurrency(code: string, custom: readonly Currency[] | undefined): Currency;
/** Throws `CurrencyMismatchError` unless the two are the same currency. */
export declare function assertSameCurrency(a: Currency, b: Currency): void;
//# sourceMappingURL=currency.d.ts.map
/**
 * Exact money. A `Money` is a whole number of units, a scale (how many of the
 * digits are decimals) and a currency: `19.99 EUR` is `1999` units at scale 2.
 *
 * Rules that protect you from silent loss:
 * - Nothing rounds unless you pass a rounding mode. An operation whose exact
 *   result does not fit throws `RoundingNecessaryError`.
 * - Mixing currencies throws `CurrencyMismatchError`. With literal codes the
 *   compiler already rejects it: `Money<'EUR'>` cannot be added to `Money<'USD'>`.
 * - `allocate` and `split` return parts that add back to the whole exactly.
 * - A `Money` never becomes a float by accident: `+price` throws.
 *
 * Speed: units are a plain `number` while they are a safe integer (up to 90
 * trillion in a two-decimal currency) and a `bigint` only beyond that. Values
 * are immutable through `readonly` and a private constructor; they are not
 * frozen, because `Object.freeze` costs more per operation than the arithmetic.
 */
import type { RoundingMode } from '@arki/math/rounding';
import type { Currency, CurrencyLike } from './currency.js';
import type { Units } from './internal/units.js';
export type { Units } from './internal/units.js';
/** An exact decimal such as `@arki/math`'s `Decimal`: `coefficient × 10^-scale`. */
export type DecimalLike = {
    readonly coefficient: bigint;
    readonly scale: number;
};
/** An exact fraction such as `@arki/math`'s `Rational`. */
export type RationalLike = {
    readonly numerator: bigint;
    readonly denominator: bigint;
};
/**
 * An amount in major units: `'19.99'`, `19.99`, `20n`, a `Decimal` or a `Rational`.
 * A `number` is read as written (`19.99` is exactly 19.99); earlier float
 * arithmetic cannot be undone, so prefer strings for computed values.
 */
export type Amount = number | string | bigint | DecimalLike | RationalLike;
/** A multiplier or divisor: an `Amount` or a `Factor` prepared once with `factor()`. */
export type FactorInput = Amount | Factor;
export type MoneyOptions = {
    /** How to drop digits that do not fit. Without it, extra digits throw `RoundingNecessaryError`. */
    rounding?: RoundingMode;
    /** Number of decimals to keep, 0–100. Defaults to the currency's (2 for EUR). Use 4 for unit prices. */
    scale?: number;
};
/** Who gets the leftover units when an amount does not divide evenly. */
export type RemainderPolicy = 'largest' | 'first' | 'last';
export type AllocateOptions = {
    /**
     * `'largest'` (default): one unit each to the parts whose exact share lost
     * the most, earlier parts first on ties. `'first'` / `'last'`: one unit each
     * from the start / end. Parts with a zero ratio never receive a unit.
     */
    remainder?: RemainderPolicy;
};
export type MoneyJSON = {
    amount: string;
    currency: string;
};
/** A multiplier read once, for loops: `const vat = factor('0.19')`. */
export declare class Factor {
    readonly numerator: Units;
    /** Always positive. */
    readonly denominator: Units;
    private constructor();
}
/** Prepares a multiplier once so `times` skips parsing: `price.times(vat, 'halfEven')`. */
export declare function factor(value: Amount): Factor;
/** An immutable amount of money. Create one with `money()` or the `Money.*` factories. */
export declare class Money<C extends string = string> {
    /** The amount as a whole number of `10^-scale` units, in canonical form: a `number` exactly when it is a safe integer. */
    readonly units: Units;
    /** Number of decimals the amount carries. Equals `currency.scale` unless chosen otherwise. */
    readonly scale: number;
    readonly currency: Currency<C>;
    private constructor();
    /**
     * `Money.of('19.99', 'EUR')`. Extra digits throw `RoundingNecessaryError`
     * unless `options.rounding` is given: `Money.of('1.005', 'EUR', { rounding: 'halfEven' })` → `1.00 EUR`.
     * A `Money` input must be in the same currency; this also narrows `Money<string>` to `Money<'EUR'>`.
     */
    static of<const C extends string>(amount: Amount | Money, currency: CurrencyLike<C>, options?: MoneyOptions): Money<C>;
    /**
     * From whole minor units: `Money.fromMinor(1999, 'EUR')` → `19.99 EUR`. Accepts a
     * safe-integer `number`, a `bigint`, or an integer string (as databases return
     * `BIGINT`). `scale` says how many decimals the units carry; it defaults to the currency's.
     */
    static fromMinor<const C extends string>(units: number | bigint | string, currency: CurrencyLike<C>, scale?: number): Money<C>;
    /** Zero in this currency. */
    static zero<const C extends string>(currency: CurrencyLike<C>, scale?: number): Money<C>;
    /**
     * Reads what `toString()` writes: `'19.99 EUR'`, also `'EUR 19.99'`. Keeps the
     * text's decimals when there are more than the currency's (`'1.2345 EUR'`
     * stays at scale 4). Pass `currencies` to resolve custom codes.
     */
    static parse(text: string, currencies?: readonly Currency[]): Money;
    /** Reads `{ amount: '19.99', currency: 'EUR' }`, keeping the amount's decimals. Validates the shape. */
    static fromJSON(value: unknown, currencies?: readonly Currency[]): Money;
    /** Comparator for sorting: `prices.sort(Money.compare)`. Throws on mixed currencies. */
    static compare(this: void, a: Money, b: Money): -1 | 0 | 1;
    /** Exact sum. Different scales are aligned upward, never rounded. */
    plus(other: Money<C>): Money<C>;
    /** Exact difference. Different scales are aligned upward, never rounded. */
    minus(other: Money<C>): Money<C>;
    /**
     * Multiplies and keeps this scale. `money('10.00', 'EUR').times(3)` → `30.00`.
     * `times('1.19')` on `9.99` is `11.8881`, which does not fit two decimals, so
     * it throws unless you pass a rounding mode: `times('1.19', 'halfEven')` → `11.89`.
     */
    times(multiplier: FactorInput, rounding?: RoundingMode): Money<C>;
    /** Divides and keeps this scale. Inexact results need a rounding mode. Zero throws `DivisionByZeroError`. */
    dividedBy(divisor: FactorInput, rounding?: RoundingMode): Money<C>;
    /** `money(200, 'EUR').percentage(15)` → `30.00 EUR`. Same as `times(percent / 100)`. */
    percentage(percent: FactorInput, rounding?: RoundingMode): Money<C>;
    negated(): Money<C>;
    abs(): Money<C>;
    /** Changes the number of decimals. Dropping non-zero digits needs a rounding mode. */
    toScale(scale: number, rounding?: RoundingMode): Money<C>;
    /**
     * Rounds to a multiple of `step`, for cash: `chf.roundToStep('0.05', 'halfUp')`.
     * Cash steps are set by each country's law (CHF 0.05, SEK 1, EUR 0.05 in some
     * euro countries), so the package does not guess them. The step must fit this scale.
     */
    roundToStep(step: FactorInput, rounding?: RoundingMode): Money<C>;
    /**
     * Splits by ratios into parts that add back to this amount exactly:
     * `money(100, 'EUR').allocate([1, 1, 1])` → `[33.34, 33.33, 33.33]`.
     * Ratios are non-negative numbers, bigints or decimal strings, not all zero.
     * A negative amount is split like a positive one and each part re-signed.
     */
    allocate(ratios: readonly (number | bigint | string)[], options?: AllocateOptions): Money<C>[];
    /** Splits into `parts` equal shares that differ by at most one unit: `money(10, 'EUR').split(3)` → `[3.34, 3.33, 3.33]`. */
    split(parts: number, options?: AllocateOptions): Money<C>[];
    /** Compares values across scales (`1.5` equals `1.50`). Throws on mixed currencies. */
    compareTo(other: Money<C>): -1 | 0 | 1;
    eq(other: Money<C>): boolean;
    lt(other: Money<C>): boolean;
    lte(other: Money<C>): boolean;
    gt(other: Money<C>): boolean;
    gte(other: Money<C>): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    sign(): -1 | 0 | 1;
    /** Same currency. Never throws. */
    hasSameCurrency(other: Money): boolean;
    /** Units at the currency's scale: `19.99 EUR` → `1999`. Throws `RoundingNecessaryError` if sub-cent digits are not zero. */
    toMinorUnits(): Units;
    /** `toMinorUnits()` as a `bigint`. */
    toMinorBigInt(): bigint;
    /** `toMinorUnits()` as a `number`, as payment APIs want. Throws `NumericRangeError` past 2^53. */
    toMinorNumber(): number;
    /** Plain decimal text with exactly `scale` decimals: `'19.99'`, `'-0.50'`, `'1000'` for JPY. For databases. */
    toDecimalString(): string;
    /** The nearest double. For charts and display math only, never for more money math. */
    toNumber(): number;
    /** `'19.99 EUR'`. Locale-free; `Money.parse` reads it back. */
    toString(): string;
    /** `{ amount: '19.99', currency: 'EUR' }`. The amount is a string, so no digit is ever lost. */
    toJSON(): MoneyJSON;
    /** Throws. A `Money` never silently becomes a float. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: string): string;
    get [Symbol.toStringTag](): string;
}
/** Shorthand for `Money.of`: `money('19.99', 'EUR')`. */
export declare function money<const C extends string>(amount: Amount | Money, currency: CurrencyLike<C>, options?: MoneyOptions): Money<C>;
export declare function isMoney(value: unknown): value is Money;
/**
 * Exact total of one currency, with one allocation for the result. An empty
 * list needs `currency` and returns zero; otherwise it throws `InvalidArgumentError`.
 */
export declare function sum<const C extends string>(items: Iterable<Money<C>>, currency?: CurrencyLike<C>): Money<C>;
/** Mean of one currency. Inexact results need a rounding mode. An empty list throws `EmptyDataError`. */
export declare function average<const C extends string>(items: Iterable<Money<C>>, rounding?: RoundingMode): Money<C>;
/** The smallest value; ties return the first. */
export declare function min<const C extends string>(first: Money<C>, ...rest: Money<C>[]): Money<C>;
/** The largest value; ties return the first. */
export declare function max<const C extends string>(first: Money<C>, ...rest: Money<C>[]): Money<C>;
//# sourceMappingURL=money.d.ts.map
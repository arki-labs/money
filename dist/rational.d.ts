/**
 * Exact in-between money. A `RationalMoney` is a fraction of major units plus
 * a currency, so a chain of steps (split a third, add tax, convert) never
 * rounds until you settle it with `toMoney`, and the currency travels with
 * the value the whole way: EUR and USD still cannot be mixed.
 *
 * ```ts
 * const share = RationalMoney.from(money(100, 'EUR')).dividedBy(3).times('1.19');
 * share.toString();                         // '119/3 EUR'
 * share.toMoney({ rounding: 'halfEven' });  // 39.67 EUR, rounded once
 * ```
 */
import type { Rational } from '@arki/math/rational';
import type { Currency, CurrencyLike } from './currency.js';
import type { Amount, FactorInput, MoneyJSON, MoneyOptions } from './money.js';
import { Money } from './money.js';
/** Something with an exact value in a currency: a `Money` or a `RationalMoney`. */
export type ExactMoney<C extends string = string> = Money<C> | RationalMoney<C>;
/** An immutable exact amount: a fraction of major units in one currency. */
export declare class RationalMoney<C extends string = string> {
    /** Major units as a reduced fraction. */
    readonly amount: Rational;
    readonly currency: Currency<C>;
    private constructor();
    /** `RationalMoney.of('1/3', 'EUR')`, or any `Amount` (`'19.99'`, `ratio(1, 3)`). Never rounds. */
    static of<const C extends string>(amount: Amount | ExactMoney, currency: CurrencyLike<C>): RationalMoney<C>;
    /** The exact value of a `Money`. */
    static from<C extends string>(value: Money<C>): RationalMoney<C>;
    /** Zero in this currency. */
    static zero<const C extends string>(currency: CurrencyLike<C>): RationalMoney<C>;
    /** Reads `{ amount: '1/3', currency: 'EUR' }`, as written by `toJSON`. */
    static fromJSON(value: unknown, currencies?: readonly Currency[]): RationalMoney;
    plus(other: ExactMoney<C>): RationalMoney<C>;
    minus(other: ExactMoney<C>): RationalMoney<C>;
    times(multiplier: FactorInput): RationalMoney<C>;
    /** Zero throws `DivisionByZeroError`. */
    dividedBy(divisor: FactorInput): RationalMoney<C>;
    /** `percentage(15)` is `times(15 / 100)`. */
    percentage(percent: FactorInput): RationalMoney<C>;
    negated(): RationalMoney<C>;
    abs(): RationalMoney<C>;
    compareTo(other: ExactMoney<C>): -1 | 0 | 1;
    eq(other: ExactMoney<C>): boolean;
    lt(other: ExactMoney<C>): boolean;
    lte(other: ExactMoney<C>): boolean;
    gt(other: ExactMoney<C>): boolean;
    gte(other: ExactMoney<C>): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    sign(): -1 | 0 | 1;
    /**
     * Rounds once to a `Money` at the currency's scale (or `options.scale`).
     * An inexact value needs `options.rounding`: `'1/3 EUR'` throws without it.
     */
    toMoney(options?: MoneyOptions): Money<C>;
    /** `'1/3 EUR'`, `'5 EUR'`. */
    toString(): string;
    /** `{ amount: '1/3', currency: 'EUR' }`. */
    toJSON(): MoneyJSON;
    /** Throws. Settle with `toMoney()` first. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: string): string;
    get [Symbol.toStringTag](): string;
}
export declare function isRationalMoney(value: unknown): value is RationalMoney;
//# sourceMappingURL=rational.d.ts.map
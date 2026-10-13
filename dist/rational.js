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
import { InvalidArgumentError } from '@arki/math/errors';
import { ratio } from '@arki/math/rational';
import { assertSameCurrency, resolveCurrency, toCurrency } from './currency.js';
import { Money, toFraction } from './money.js';
const BRAND = Symbol('RationalMoney');
function fraction(value) {
    const [numerator, denominator] = toFraction(value);
    return ratio(BigInt(numerator), BigInt(denominator));
}
function toRationalAmount(value) {
    return value instanceof RationalMoney ? value.amount : ratio(BigInt(value.units), 10n ** BigInt(value.scale));
}
function refuseCoercion() {
    throw new TypeError('RationalMoney cannot be turned into a number implicitly; settle it with toMoney()');
}
/** An immutable exact amount: a fraction of major units in one currency. */
export class RationalMoney {
    /** Major units as a reduced fraction. */
    amount;
    currency;
    constructor(amount, currency, brand) {
        if (brand !== BRAND)
            throw new TypeError('Use RationalMoney.of() or RationalMoney.from() instead of new');
        this.amount = amount;
        this.currency = currency;
    }
    /** `RationalMoney.of('1/3', 'EUR')`, or any `Amount` (`'19.99'`, `ratio(1, 3)`). Never rounds. */
    static of(amount, currency) {
        const cur = toCurrency(currency);
        if (amount instanceof Money || amount instanceof RationalMoney) {
            assertSameCurrency(amount.currency, cur);
            return new RationalMoney(toRationalAmount(amount), cur, BRAND);
        }
        if (typeof amount === 'string' && amount.includes('/'))
            return new RationalMoney(ratio(amount), cur, BRAND);
        return new RationalMoney(fraction(amount), cur, BRAND);
    }
    /** The exact value of a `Money`. */
    static from(value) {
        return new RationalMoney(toRationalAmount(value), value.currency, BRAND);
    }
    /** Zero in this currency. */
    static zero(currency) {
        return new RationalMoney(ratio(0), toCurrency(currency), BRAND);
    }
    /** Reads `{ amount: '1/3', currency: 'EUR' }`, as written by `toJSON`. */
    static fromJSON(value, currencies) {
        if (typeof value !== 'object' || value === null || !('amount' in value) || !('currency' in value)) {
            throw new InvalidArgumentError('Expected { amount: string, currency: string }');
        }
        const { amount, currency } = value;
        if (typeof amount !== 'string' || typeof currency !== 'string') {
            throw new InvalidArgumentError('Expected { amount: string, currency: string }');
        }
        return RationalMoney.of(amount, resolveCurrency(currency, currencies));
    }
    /** @internal */
    static create(amount, currency) {
        return new RationalMoney(amount, currency, BRAND);
    }
    // Arithmetic: always exact ------------------------------------------------
    plus(other) {
        assertSameCurrency(this.currency, other.currency);
        return new RationalMoney(this.amount.plus(toRationalAmount(other)), this.currency, BRAND);
    }
    minus(other) {
        assertSameCurrency(this.currency, other.currency);
        return new RationalMoney(this.amount.minus(toRationalAmount(other)), this.currency, BRAND);
    }
    times(multiplier) {
        return new RationalMoney(this.amount.times(fraction(multiplier)), this.currency, BRAND);
    }
    /** Zero throws `DivisionByZeroError`. */
    dividedBy(divisor) {
        return new RationalMoney(this.amount.dividedBy(fraction(divisor)), this.currency, BRAND);
    }
    /** `percentage(15)` is `times(15 / 100)`. */
    percentage(percent) {
        return new RationalMoney(this.amount.times(fraction(percent)).dividedBy(100), this.currency, BRAND);
    }
    negated() {
        return new RationalMoney(this.amount.negated(), this.currency, BRAND);
    }
    abs() {
        return this.amount.isNegative() ? this.negated() : this;
    }
    // Comparison --------------------------------------------------------------
    compareTo(other) {
        assertSameCurrency(this.currency, other.currency);
        return this.amount.compareTo(toRationalAmount(other));
    }
    eq(other) {
        return this.compareTo(other) === 0;
    }
    lt(other) {
        return this.compareTo(other) < 0;
    }
    lte(other) {
        return this.compareTo(other) <= 0;
    }
    gt(other) {
        return this.compareTo(other) > 0;
    }
    gte(other) {
        return this.compareTo(other) >= 0;
    }
    isZero() {
        return this.amount.isZero();
    }
    isPositive() {
        return this.amount.isPositive();
    }
    isNegative() {
        return this.amount.isNegative();
    }
    sign() {
        return this.amount.sign();
    }
    // Settling and output -----------------------------------------------------
    /**
     * Rounds once to a `Money` at the currency's scale (or `options.scale`).
     * An inexact value needs `options.rounding`: `'1/3 EUR'` throws without it.
     */
    toMoney(options) {
        return Money.of(this.amount, this.currency, options);
    }
    /** `'1/3 EUR'`, `'5 EUR'`. */
    toString() {
        return `${this.amount.toString()} ${this.currency.code}`;
    }
    /** `{ amount: '1/3', currency: 'EUR' }`. */
    toJSON() {
        return { amount: this.amount.toString(), currency: this.currency.code };
    }
    /** Throws. Settle with `toMoney()` first. */
    valueOf() {
        return refuseCoercion();
    }
    [Symbol.toPrimitive](hint) {
        return hint === 'string' ? this.toString() : refuseCoercion();
    }
    // A getter lives on the prototype; a field would add a slot to every value.
    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get [Symbol.toStringTag]() {
        return 'RationalMoney';
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `RationalMoney(${this.toString()})`;
    }
    [Symbol.for('Deno.customInspect')]() {
        return `RationalMoney(${this.toString()})`;
    }
}
export function isRationalMoney(value) {
    return value instanceof RationalMoney;
}
//# sourceMappingURL=rational.js.map
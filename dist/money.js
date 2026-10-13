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
import { DivisionByZeroError, EmptyDataError, InvalidArgumentError, NumberFormatError, NumericRangeError, ResourceLimitError, RoundingNecessaryError, } from '@arki/math/errors';
import { assertSameCurrency, resolveCurrency, toCurrency } from './currency.js';
import { addUnits, canon, compareUnits, MAX_INPUT_LENGTH, MAX_PARTS, MAX_SCALE, mulDiv, mulUnits, negUnits, parseDecimal, parseNumber, pow10, quantize, } from './internal/units.js';
const BRAND = Symbol('Money');
const MAX = Number.MAX_SAFE_INTEGER;
const INTEGER = /^[+-]?\d+$/;
// `read()` leaves a factor's fraction here instead of allocating an object.
let num = 0;
let den = 1;
/** A multiplier read once, for loops: `const vat = factor('0.19')`. */
export class Factor {
    numerator;
    /** Always positive. */
    denominator;
    constructor(numerator, denominator, brand) {
        if (brand !== BRAND)
            throw new TypeError('Use factor(value) instead of new Factor()');
        this.numerator = numerator;
        this.denominator = denominator;
    }
    /** @internal */
    static create(numerator, denominator) {
        return new Factor(numerator, denominator, BRAND);
    }
}
/** Prepares a multiplier once so `times` skips parsing: `price.times(vat, 'halfEven')`. */
export function factor(value) {
    read(value);
    return Factor.create(num, den);
}
function read(value) {
    if (typeof value === 'number') {
        if (Number.isSafeInteger(value)) {
            num = value + 0;
            den = 1;
            return;
        }
        const parsed = parseNumber(value);
        num = parsed.coefficient;
        den = pow10(parsed.fraction);
        return;
    }
    if (typeof value === 'string') {
        const parsed = parseDecimal(value);
        num = parsed.coefficient;
        den = pow10(parsed.fraction);
        return;
    }
    if (typeof value === 'bigint') {
        num = canon(value);
        den = 1;
        return;
    }
    if (value instanceof Factor) {
        num = value.numerator;
        den = value.denominator;
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- plain JavaScript can pass null
    if (typeof value === 'object' && value !== null) {
        if ('coefficient' in value && typeof value.coefficient === 'bigint' && typeof value.scale === 'number') {
            if (!Number.isInteger(value.scale) || value.scale < 0 || value.scale > MAX_INPUT_LENGTH * 10) {
                throw new InvalidArgumentError(`Unsupported decimal scale ${value.scale}`);
            }
            num = canon(value.coefficient);
            den = pow10(value.scale);
            return;
        }
        if ('numerator' in value && typeof value.numerator === 'bigint' && typeof value.denominator === 'bigint') {
            if (value.denominator === 0n)
                throw new DivisionByZeroError('A ratio cannot have a zero denominator');
            const negative = value.denominator < 0n;
            num = canon(negative ? -value.numerator : value.numerator);
            den = canon(negative ? -value.denominator : value.denominator);
            return;
        }
    }
    throw new TypeError('Expected a number, string, bigint, Decimal, Rational or Factor');
}
function checkScale(scale) {
    if (!Number.isInteger(scale) || scale < 0 || scale > MAX_SCALE) {
        throw new InvalidArgumentError(`A scale is a whole number from 0 to ${MAX_SCALE}, got ${scale}`);
    }
    return scale;
}
function refuseCoercion() {
    throw new TypeError('Money cannot be turned into a number implicitly; use toDecimalString(), toMinorUnits() or toNumber()');
}
/** An immutable amount of money. Create one with `money()` or the `Money.*` factories. */
export class Money {
    /** The amount as a whole number of `10^-scale` units, in canonical form: a `number` exactly when it is a safe integer. */
    units;
    /** Number of decimals the amount carries. Equals `currency.scale` unless chosen otherwise. */
    scale;
    currency;
    constructor(units, scale, currency, brand) {
        if (brand !== BRAND)
            throw new TypeError('Use money(amount, currency) instead of new Money()');
        this.units = units;
        this.scale = scale;
        this.currency = currency;
    }
    /** @internal Builds a value from already-validated parts. */
    static create(units, scale, currency) {
        return new Money(units, scale, currency, BRAND);
    }
    // Construction -----------------------------------------------------------
    /**
     * `Money.of('19.99', 'EUR')`. Extra digits throw `RoundingNecessaryError`
     * unless `options.rounding` is given: `Money.of('1.005', 'EUR', { rounding: 'halfEven' })` → `1.00 EUR`.
     * A `Money` input must be in the same currency; this also narrows `Money<string>` to `Money<'EUR'>`.
     */
    static of(amount, currency, options) {
        const cur = toCurrency(currency);
        const scale = options?.scale === undefined ? cur.scale : checkScale(options.scale);
        const rounding = options?.rounding;
        if (amount instanceof Money) {
            assertSameCurrency(amount.currency, cur);
            return new Money(quantize(amount.units, amount.scale, scale, rounding), scale, cur, BRAND);
        }
        read(amount);
        return new Money(mulDiv(num, pow10(scale), den, rounding), scale, cur, BRAND);
    }
    /**
     * From whole minor units: `Money.fromMinor(1999, 'EUR')` → `19.99 EUR`. Accepts a
     * safe-integer `number`, a `bigint`, or an integer string (as databases return
     * `BIGINT`). `scale` says how many decimals the units carry; it defaults to the currency's.
     */
    static fromMinor(units, currency, scale) {
        const cur = toCurrency(currency);
        return new Money(toUnits(units), scale === undefined ? cur.scale : checkScale(scale), cur, BRAND);
    }
    /** Zero in this currency. */
    static zero(currency, scale) {
        const cur = toCurrency(currency);
        return new Money(0, scale === undefined ? cur.scale : checkScale(scale), cur, BRAND);
    }
    /**
     * Reads what `toString()` writes: `'19.99 EUR'`, also `'EUR 19.99'`. Keeps the
     * text's decimals when there are more than the currency's (`'1.2345 EUR'`
     * stays at scale 4). Pass `currencies` to resolve custom codes.
     */
    static parse(text, currencies) {
        if (typeof text !== 'string')
            throw new TypeError('Money.parse expects a string');
        const parts = text.trim().split(/\s+/);
        const [first = '', second = ''] = parts;
        if (parts.length !== 2) {
            throw new NumberFormatError(`Cannot read ${JSON.stringify(text.slice(0, 40))} as money; expected '19.99 EUR'`);
        }
        const amountFirst = /^[+-]?\d/.test(first);
        return fromText(amountFirst ? first : second, resolveCurrency(amountFirst ? second : first, currencies));
    }
    /** Reads `{ amount: '19.99', currency: 'EUR' }`, keeping the amount's decimals. Validates the shape. */
    static fromJSON(value, currencies) {
        if (typeof value !== 'object' || value === null || !('amount' in value) || !('currency' in value)) {
            throw new InvalidArgumentError('Expected { amount: string, currency: string }');
        }
        const { amount, currency } = value;
        if (typeof amount !== 'string' || typeof currency !== 'string') {
            throw new InvalidArgumentError('Expected { amount: string, currency: string }');
        }
        return fromText(amount, resolveCurrency(currency, currencies));
    }
    /** Comparator for sorting: `prices.sort(Money.compare)`. Throws on mixed currencies. */
    static compare(a, b) {
        return a.compareTo(b);
    }
    // Arithmetic -------------------------------------------------------------
    /** Exact sum. Different scales are aligned upward, never rounded. */
    plus(other) {
        const cur = this.currency;
        if (cur !== other.currency)
            assertSameCurrency(cur, other.currency);
        const scale = this.scale;
        if (scale !== other.scale)
            return combine(this, other, false);
        const a = this.units;
        const b = other.units;
        if (typeof a === 'number' && typeof b === 'number') {
            const sum = a + b;
            if (sum <= MAX && sum >= -MAX)
                return new Money(sum, scale, cur, BRAND);
        }
        return new Money(addUnits(a, b), scale, cur, BRAND);
    }
    /** Exact difference. Different scales are aligned upward, never rounded. */
    minus(other) {
        const cur = this.currency;
        if (cur !== other.currency)
            assertSameCurrency(cur, other.currency);
        const scale = this.scale;
        if (scale !== other.scale)
            return combine(this, other, true);
        const a = this.units;
        const b = other.units;
        if (typeof a === 'number' && typeof b === 'number') {
            const difference = a - b;
            if (difference <= MAX && difference >= -MAX)
                return new Money(difference, scale, cur, BRAND);
        }
        return new Money(addUnits(a, negUnits(b)), scale, cur, BRAND);
    }
    /**
     * Multiplies and keeps this scale. `money('10.00', 'EUR').times(3)` → `30.00`.
     * `times('1.19')` on `9.99` is `11.8881`, which does not fit two decimals, so
     * it throws unless you pass a rounding mode: `times('1.19', 'halfEven')` → `11.89`.
     */
    times(multiplier, rounding) {
        if (typeof multiplier === 'number' && Number.isSafeInteger(multiplier)) {
            return new Money(mulUnits(this.units, multiplier), this.scale, this.currency, BRAND);
        }
        read(multiplier);
        return new Money(mulDiv(this.units, num, den, rounding), this.scale, this.currency, BRAND);
    }
    /** Divides and keeps this scale. Inexact results need a rounding mode. Zero throws `DivisionByZeroError`. */
    dividedBy(divisor, rounding) {
        read(divisor);
        const n = num;
        const d = den;
        if (n === 0)
            throw new DivisionByZeroError('Division by zero');
        const units = n < 0 ? mulDiv(negUnits(this.units), d, negUnits(n), rounding) : mulDiv(this.units, d, n, rounding);
        return new Money(units, this.scale, this.currency, BRAND);
    }
    /** `money(200, 'EUR').percentage(15)` → `30.00 EUR`. Same as `times(percent / 100)`. */
    percentage(percent, rounding) {
        read(percent);
        return new Money(mulDiv(this.units, num, mulUnits(den, 100), rounding), this.scale, this.currency, BRAND);
    }
    negated() {
        return new Money(negUnits(this.units), this.scale, this.currency, BRAND);
    }
    abs() {
        return this.units < 0 ? this.negated() : this;
    }
    /** Changes the number of decimals. Dropping non-zero digits needs a rounding mode. */
    toScale(scale, rounding) {
        checkScale(scale);
        if (scale === this.scale)
            return this;
        return new Money(quantize(this.units, this.scale, scale, rounding), scale, this.currency, BRAND);
    }
    /**
     * Rounds to a multiple of `step`, for cash: `chf.roundToStep('0.05', 'halfUp')`.
     * Cash steps are set by each country's law (CHF 0.05, SEK 1, EUR 0.05 in some
     * euro countries), so the package does not guess them. The step must fit this scale.
     */
    roundToStep(step, rounding) {
        read(step);
        if (!(num > 0))
            throw new InvalidArgumentError('A rounding step must be positive');
        let stepUnits;
        try {
            stepUnits = mulDiv(num, pow10(this.scale), den);
        }
        catch (error) {
            if (!(error instanceof RoundingNecessaryError))
                throw error;
            throw new InvalidArgumentError(`The step has more decimals than this amount's ${this.scale}`, { cause: error });
        }
        const units = mulUnits(mulDiv(this.units, 1, stepUnits, rounding), stepUnits);
        return new Money(units, this.scale, this.currency, BRAND);
    }
    // Allocation -------------------------------------------------------------
    /**
     * Splits by ratios into parts that add back to this amount exactly:
     * `money(100, 'EUR').allocate([1, 1, 1])` → `[33.34, 33.33, 33.33]`.
     * Ratios are non-negative numbers, bigints or decimal strings, not all zero.
     * A negative amount is split like a positive one and each part re-signed.
     */
    allocate(ratios, options) {
        const count = ratios.length;
        if (count === 0)
            throw new InvalidArgumentError('allocate needs at least one ratio');
        if (count > MAX_PARTS)
            throw new ResourceLimitError(`allocate makes at most ${MAX_PARTS} parts`);
        const coefficients = [];
        const fractions = [];
        let common = 0;
        for (const ratio of ratios) {
            const parsed = typeof ratio === 'number'
                ? parseNumber(ratio)
                : typeof ratio === 'string'
                    ? parseDecimal(ratio)
                    : typeof ratio === 'bigint'
                        ? { coefficient: canon(ratio), fraction: 0 }
                        : badRatio();
            if (parsed.coefficient < 0)
                throw new InvalidArgumentError(`Ratios must not be negative, got ${String(ratio)}`);
            coefficients.push(parsed.coefficient);
            fractions.push(parsed.fraction);
            if (parsed.fraction > common)
                common = parsed.fraction;
        }
        const weights = [];
        let total = 0;
        for (let i = 0; i < count; i++) {
            const weight = mulUnits(coefficients[i] ?? 0, pow10(common - (fractions[i] ?? 0)));
            weights.push(weight);
            total = addUnits(total, weight);
        }
        if (total === 0)
            throw new InvalidArgumentError('Ratios must not all be zero');
        return distribute(this, weights, total, options?.remainder ?? 'largest');
    }
    /** Splits into `parts` equal shares that differ by at most one unit: `money(10, 'EUR').split(3)` → `[3.34, 3.33, 3.33]`. */
    split(parts, options) {
        if (!Number.isInteger(parts) || parts < 1)
            throw new InvalidArgumentError(`split needs a whole number of parts ≥ 1, got ${parts}`);
        if (parts > MAX_PARTS)
            throw new ResourceLimitError(`split makes at most ${MAX_PARTS} parts`);
        const negative = this.units < 0;
        const magnitude = negative ? negUnits(this.units) : this.units;
        const share = mulDiv(magnitude, 1, parts, 'down');
        const left = Number(addUnits(magnitude, negUnits(mulUnits(share, parts))));
        const bigger = addUnits(share, 1);
        const fromEnd = options?.remainder === 'last';
        const result = [];
        for (let i = 0; i < parts; i++) {
            const gets = fromEnd ? i >= parts - left : i < left;
            const units = gets ? bigger : share;
            result.push(new Money(negative ? negUnits(units) : units, this.scale, this.currency, BRAND));
        }
        return result;
    }
    // Comparison -------------------------------------------------------------
    /** Compares values across scales (`1.5` equals `1.50`). Throws on mixed currencies. */
    compareTo(other) {
        if (this.currency !== other.currency)
            assertSameCurrency(this.currency, other.currency);
        if (this.scale === other.scale)
            return compareUnits(this.units, other.units);
        const scale = Math.max(this.scale, other.scale);
        return compareUnits(mulUnits(this.units, pow10(scale - this.scale)), mulUnits(other.units, pow10(scale - other.scale)));
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
        return this.units === 0;
    }
    isPositive() {
        return this.units > 0;
    }
    isNegative() {
        return this.units < 0;
    }
    sign() {
        return compareUnits(this.units, 0);
    }
    /** Same currency. Never throws. */
    hasSameCurrency(other) {
        return this.currency.eq(other.currency);
    }
    // Output -----------------------------------------------------------------
    /** Units at the currency's scale: `19.99 EUR` → `1999`. Throws `RoundingNecessaryError` if sub-cent digits are not zero. */
    toMinorUnits() {
        return quantize(this.units, this.scale, this.currency.scale);
    }
    /** `toMinorUnits()` as a `bigint`. */
    toMinorBigInt() {
        return BigInt(this.toMinorUnits());
    }
    /** `toMinorUnits()` as a `number`, as payment APIs want. Throws `NumericRangeError` past 2^53. */
    toMinorNumber() {
        const units = this.toMinorUnits();
        if (typeof units !== 'number')
            throw new NumericRangeError(`${this.toString()} has too many minor units for a number`);
        return units;
    }
    /** Plain decimal text with exactly `scale` decimals: `'19.99'`, `'-0.50'`, `'1000'` for JPY. For databases. */
    toDecimalString() {
        const units = this.units;
        const negative = units < 0;
        let digits = String(negative ? negUnits(units) : units);
        const scale = this.scale;
        if (scale === 0)
            return negative ? `-${digits}` : digits;
        if (digits.length <= scale)
            digits = '0'.repeat(scale - digits.length + 1) + digits;
        const text = `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
        return negative ? `-${text}` : text;
    }
    /** The nearest double. For charts and display math only, never for more money math. */
    toNumber() {
        return Number(this.toDecimalString());
    }
    /** `'19.99 EUR'`. Locale-free; `Money.parse` reads it back. */
    toString() {
        return `${this.toDecimalString()} ${this.currency.code}`;
    }
    /** `{ amount: '19.99', currency: 'EUR' }`. The amount is a string, so no digit is ever lost. */
    toJSON() {
        return { amount: this.toDecimalString(), currency: this.currency.code };
    }
    /** Throws. A `Money` never silently becomes a float. */
    valueOf() {
        return refuseCoercion();
    }
    [Symbol.toPrimitive](hint) {
        return hint === 'string' ? this.toString() : refuseCoercion();
    }
    // A getter lives on the prototype; a field would add a slot to every Money.
    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get [Symbol.toStringTag]() {
        return 'Money';
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Money(${this.toString()})`;
    }
    [Symbol.for('Deno.customInspect')]() {
        return `Money(${this.toString()})`;
    }
}
function badRatio() {
    throw new TypeError('Ratios must be numbers, bigints or decimal strings');
}
function toUnits(value) {
    if (typeof value === 'number') {
        if (!Number.isSafeInteger(value))
            throw new NumericRangeError(`Minor units must be a safe integer, got ${value}`);
        return value + 0;
    }
    if (typeof value === 'bigint')
        return canon(value);
    if (typeof value === 'string' && value.length <= MAX_INPUT_LENGTH && INTEGER.test(value))
        return canon(BigInt(value));
    throw new NumberFormatError(`Minor units must be a whole number, got ${JSON.stringify(String(value).slice(0, 40))}`);
}
function fromText(text, currency) {
    const parsed = parseDecimal(text);
    const scale = checkScale(Math.max(parsed.fraction, currency.scale));
    return Money.create(quantize(parsed.coefficient, parsed.fraction, scale), scale, currency);
}
function combine(a, b, subtract) {
    const scale = Math.max(a.scale, b.scale);
    const left = mulUnits(a.units, pow10(scale - a.scale));
    const right = mulUnits(b.units, pow10(scale - b.scale));
    return Money.create(addUnits(left, subtract ? negUnits(right) : right), scale, a.currency);
}
function distribute(whole, weights, total, policy) {
    const negative = whole.units < 0;
    const magnitude = negative ? negUnits(whole.units) : whole.units;
    const count = weights.length;
    const shares = [];
    const rests = [];
    let given = 0;
    for (let i = 0; i < count; i++) {
        const exact = mulUnits(magnitude, weights[i] ?? 0);
        const share = mulDiv(exact, 1, total, 'down');
        shares.push(share);
        rests.push(addUnits(exact, negUnits(mulUnits(share, total))));
        given = addUnits(given, share);
    }
    // Fewer than `count` units are left, and only parts with a non-zero rest can need one.
    let left = Number(addUnits(magnitude, negUnits(given)));
    if (left > 0) {
        const order = [];
        for (let i = 0; i < count; i++)
            if (weights[i] !== 0)
                order.push(i);
        if (policy === 'largest')
            order.sort((x, y) => compareUnits(rests[y] ?? 0, rests[x] ?? 0) || x - y);
        else if (policy === 'last')
            order.reverse();
        for (const index of order) {
            if (left === 0)
                break;
            shares[index] = addUnits(shares[index] ?? 0, 1);
            left -= 1;
        }
    }
    return shares.map(share => Money.create(negative ? negUnits(share) : share, whole.scale, whole.currency));
}
// Shorthands and aggregates ------------------------------------------------
/** Shorthand for `Money.of`: `money('19.99', 'EUR')`. */
export function money(amount, currency, options) {
    return Money.of(amount, currency, options);
}
export function isMoney(value) {
    return value instanceof Money;
}
/**
 * Exact total of one currency, with one allocation for the result. An empty
 * list needs `currency` and returns zero; otherwise it throws `InvalidArgumentError`.
 */
export function sum(items, currency) {
    let cur = currency === undefined ? undefined : toCurrency(currency);
    let scale = cur?.scale ?? -1;
    let units = 0;
    for (const item of items) {
        if (cur === undefined) {
            cur = item.currency;
            scale = item.scale;
        }
        else if (cur !== item.currency) {
            assertSameCurrency(cur, item.currency);
        }
        let value = item.units;
        if (item.scale > scale) {
            units = mulUnits(units, pow10(item.scale - scale));
            scale = item.scale;
        }
        else if (item.scale < scale) {
            value = mulUnits(value, pow10(scale - item.scale));
        }
        if (typeof units === 'number' && typeof value === 'number') {
            const next = units + value;
            units = next <= MAX && next >= -MAX ? next : addUnits(units, value);
        }
        else {
            units = addUnits(units, value);
        }
    }
    if (cur === undefined)
        throw new InvalidArgumentError('sum of an empty list needs a currency');
    return Money.create(units, scale, cur);
}
/** Mean of one currency. Inexact results need a rounding mode. An empty list throws `EmptyDataError`. */
export function average(items, rounding) {
    const list = [...items];
    if (list.length === 0)
        throw new EmptyDataError('average of an empty list');
    return sum(list).dividedBy(list.length, rounding);
}
/** The smallest value; ties return the first. */
export function min(first, ...rest) {
    let best = first;
    for (const item of rest)
        if (item.lt(best))
            best = item;
    return best;
}
/** The largest value; ties return the first. */
export function max(first, ...rest) {
    let best = first;
    for (const item of rest)
        if (item.gt(best))
            best = item;
    return best;
}
/** @internal Reads an amount or factor as an exact fraction whose denominator is positive. */
export function toFraction(value) {
    read(value);
    return [num, den];
}
//# sourceMappingURL=money.js.map
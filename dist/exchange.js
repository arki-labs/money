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
import { assertSameCurrency, Currency, toCurrency } from './currency.js';
import { ExchangeRateError } from './errors.js';
import { divExact, gcdUnits, mulDiv, mulUnits, pow10, quantize } from './internal/units.js';
import { Money, toFraction } from './money.js';
const BRAND = Symbol('ExchangeRate');
/** An exact, directed rate: one unit of `base` buys `numerator / denominator` units of `quote`. */
export class ExchangeRate {
    base;
    quote;
    /** Positive, in lowest terms with `denominator`. */
    numerator;
    /** Positive. */
    denominator;
    constructor(base, quote, numerator, denominator, brand) {
        if (brand !== BRAND)
            throw new TypeError('Use exchangeRate(base, quote, value) instead of new ExchangeRate()');
        this.base = base;
        this.quote = quote;
        const divisor = gcdUnits(numerator, denominator);
        this.numerator = divExact(numerator, divisor);
        this.denominator = divExact(denominator, divisor);
        Object.freeze(this);
    }
    /** @internal */
    static create(base, quote, numerator, denominator) {
        return new ExchangeRate(base, quote, numerator, denominator, BRAND);
    }
    /** The reverse rate, exact: `EUR/USD 1.0832` → `USD/EUR 625/677`. */
    inverse() {
        return new ExchangeRate(this.quote, this.base, this.denominator, this.numerator, BRAND);
    }
    /** Chains two rates, exact: `EUR→USD` then `USD→JPY` gives `EUR→JPY`. */
    chain(next) {
        assertSameCurrency(this.quote, next.base);
        return new ExchangeRate(this.base, next.quote, mulUnits(this.numerator, next.numerator), mulUnits(this.denominator, next.denominator), BRAND);
    }
    /** `true` for the same pair and the same exact value. */
    eq(other) {
        return (this.base.eq(other.base) &&
            this.quote.eq(other.quote) &&
            this.numerator === other.numerator &&
            this.denominator === other.denominator);
    }
    /** `'EUR/USD 1.0832'`, or `'USD/EUR 625/677'` when the rate has no finite decimal form. */
    toString() {
        return `${this.base.code}/${this.quote.code} ${rateText(this.numerator, this.denominator)}`;
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `ExchangeRate(${this.toString()})`;
    }
    [Symbol.for('Deno.customInspect')]() {
        return `ExchangeRate(${this.toString()})`;
    }
}
function rateText(numerator, denominator) {
    // A fraction has a finite decimal form when its denominator has no prime factors other than 2 and 5.
    let rest = BigInt(denominator);
    let twos = 0;
    let fives = 0;
    while (rest % 2n === 0n) {
        rest /= 2n;
        twos++;
    }
    while (rest % 5n === 0n) {
        rest /= 5n;
        fives++;
    }
    if (rest !== 1n)
        return `${String(numerator)}/${String(denominator)}`;
    const scale = Math.max(twos, fives);
    const digits = String(mulDiv(numerator, pow10(scale), denominator)).padStart(scale + 1, '0');
    return scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}
/** `exchangeRate('EUR', 'USD', '1.0832')`: one euro buys 1.0832 dollars. The value must be positive. */
export function exchangeRate(base, quote, value) {
    const from = toCurrency(base);
    const to = toCurrency(quote);
    const [numerator, denominator] = toFraction(value);
    if (!(numerator > 0))
        throw new ExchangeRateError(`An exchange rate must be positive (${from.code}/${to.code})`);
    if (from.eq(to) && numerator !== denominator) {
        throw new ExchangeRateError(`A rate from ${from.code} to itself must be 1`);
    }
    return ExchangeRate.create(from, to, numerator, denominator);
}
/** `ratesFrom({ base: 'EUR', rates: { USD: '1.0832' } })` → `[EUR/USD 1.0832]`. */
export function ratesFrom(table) {
    const base = toCurrency(table.base);
    return Object.entries(table.rates).map(([code, value]) => {
        const quote = table.currencies?.find(currency => currency.code === code) ?? Currency.of(code);
        return exchangeRate(base, quote, value);
    });
}
/**
 * Converts with one rate. The rate's base must be the amount's currency. The
 * exact result is rounded once to the target scale (the quote currency's,
 * or `options.scale`); an inexact result needs `options.rounding`.
 */
export function convert(amount, rate, options) {
    assertSameCurrency(amount.currency, rate.base);
    const scale = options?.scale ?? rate.quote.scale;
    return Money.fromMinor(convertUnits(amount, rate, scale, options), rate.quote, scale);
}
/** The one rounding of a conversion: `units × rate × 10^(target − source scale)`. */
function convertUnits(amount, rate, scale, options) {
    return mulDiv(amount.units, mulUnits(rate.numerator, pow10(scale)), mulUnits(rate.denominator, pow10(amount.scale)), options?.rounding);
}
/** A fixed set of rates with lookups. Build it with `createConverter`. Immutable. */
export class Converter {
    rates;
    inverse;
    via;
    /** Resolved lookups, including misses. Rates never change, so the cache never goes stale. */
    resolved = new Map();
    constructor(rates, options = {}) {
        const map = new Map();
        for (const rate of rates) {
            if (!(rate instanceof ExchangeRate))
                throw new TypeError('Expected ExchangeRate values');
            const key = pairKey(rate.base, rate.quote);
            const existing = map.get(key);
            if (existing !== undefined && !existing.eq(rate)) {
                throw new ExchangeRateError(`Two different rates for ${rate.base.code}/${rate.quote.code}`);
            }
            map.set(key, rate);
        }
        this.rates = map;
        this.inverse = options.inverse === true;
        this.via = options.via === undefined ? undefined : toCurrency(options.via);
    }
    /** The exact rate used for `from → to`. Throws `ExchangeRateError` when none can be found. */
    rate(from, to) {
        const a = toCurrency(from);
        const b = toCurrency(to);
        const found = this.resolve(a, b);
        return ExchangeRate.create(a, b, found.numerator, found.denominator);
    }
    /** `true` when `rate(from, to)` would succeed. */
    has(from, to) {
        const a = toCurrency(from);
        const b = toCurrency(to);
        try {
            this.resolve(a, b);
            return true;
        }
        catch (error) {
            if (error instanceof ExchangeRateError)
                return false;
            throw error;
        }
    }
    /** Converts and rounds once. Same-currency conversion needs no rate and only changes the scale. */
    convert(amount, to, options) {
        const target = toCurrency(to);
        if (amount.currency.eq(target)) {
            const scale = options?.scale ?? target.scale;
            return Money.fromMinor(quantize(amount.units, amount.scale, scale, options?.rounding), target, scale);
        }
        const scale = options?.scale ?? target.scale;
        return Money.fromMinor(convertUnits(amount, this.resolve(amount.currency, target), scale, options), target, scale);
    }
    resolve(from, to) {
        const key = pairKey(from, to);
        let found = this.resolved.get(key);
        if (found === undefined) {
            found = this.lookup(from, to) ?? this.lookupVia(from, to) ?? null;
            this.resolved.set(key, found);
        }
        if (found === null)
            throw new ExchangeRateError(`No exchange rate from ${from.code} to ${to.code}`);
        return found;
    }
    lookup(from, to) {
        if (from.eq(to))
            return ExchangeRate.create(from, to, 1, 1);
        const direct = this.rates.get(pairKey(from, to));
        if (direct !== undefined)
            return direct;
        if (this.inverse)
            return this.rates.get(pairKey(to, from))?.inverse();
        return undefined;
    }
    lookupVia(from, to) {
        const via = this.via;
        if (via === undefined || via.eq(from) || via.eq(to))
            return undefined;
        const first = this.lookup(from, via);
        const second = this.lookup(via, to);
        return first === undefined || second === undefined ? undefined : first.chain(second);
    }
}
function pairKey(from, to) {
    return `${from.code}>${to.code}`;
}
/** `createConverter(rates, { inverse: true, via: 'EUR' })`. */
export function createConverter(rates, options) {
    return new Converter(rates, options);
}
//# sourceMappingURL=exchange.js.map
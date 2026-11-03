/**
 * Currencies. The ISO 4217 list ships with the package, so a currency's number
 * of decimals is the same on every runtime and device. `Intl` is only used for
 * display (see `@arki/money/format`); it accepts made-up codes such as `ZZZ`
 * and its decimals can differ from ISO, so it never decides arithmetic.
 *
 * `Currency.of('EUR')` returns the same object every time, so comparing two
 * currencies is a pointer check on the hot path.
 */
import { InvalidArgumentError } from '@arki/math/errors';
import { ISO_4217 } from './data/iso4217.js';
import { CurrencyMismatchError, UnknownCurrencyError } from './errors.js';
import { UnknownCurrency } from './failures.js';
import { MAX_SCALE } from './internal/units.js';
export { ISO_4217_VERSION } from './data/iso4217.js';
const BRAND = Symbol('Currency');
const CUSTOM_CODE = /^[a-z][\w.:-]{0,31}$/i;
let byCode;
let byNumeric;
/** An immutable currency: its code, its ISO numeric code and its number of decimals. */
export class Currency {
    /** `'EUR'`. */
    code;
    /** Three-digit ISO numeric code as a string, so `'008'` keeps its zeros. `undefined` for most custom currencies. */
    numeric;
    /** Number of decimals: 2 for EUR, 0 for JPY, 3 for KWD. ISO codes without minor units (XAU, XTS) use 0. */
    scale;
    /** `true` for a currency from the shipped ISO 4217 table. */
    iso;
    constructor(code, numeric, scale, iso, brand) {
        if (brand !== BRAND)
            throw new TypeError('Use Currency.of(code) or Currency.custom(definition)');
        this.code = code;
        this.numeric = numeric;
        this.scale = scale;
        this.iso = iso;
        Object.freeze(this);
    }
    /**
     * The ISO 4217 currency with this upper-case code: `Currency.of('EUR')`.
     * Throws `UnknownCurrencyError` for anything not in the table, including `'eur'`.
     * For codes your code writes; read a code from outside with `Currency.parse`.
     */
    static of(code) {
        const found = Currency.parse(code);
        if (UnknownCurrency.is(found))
            throw new UnknownCurrencyError(String(code));
        return found;
    }
    /**
     * Reads a currency code from outside (a form, JSON, a provider payload): the
     * currency in `currencies` with that code, else the ISO 4217 one. Returns the
     * `UnknownCurrency` failure (`money.unknown_currency`) instead of throwing.
     */
    static parse(code, currencies) {
        if (currencies !== undefined) {
            for (const currency of currencies)
                if (hasCode(currency, code))
                    return currency;
        }
        const found = Currency.table().get(code);
        return found !== undefined && hasCode(found, code) ? found : UnknownCurrency();
    }
    /**
     * The ISO 4217 currency with this numeric code: `Currency.fromNumeric('978')` or `(978)` → EUR.
     * Throws `UnknownCurrencyError`; read a numeric code from outside with `Currency.parseNumeric`.
     */
    static fromNumeric(numeric) {
        const found = Currency.parseNumeric(numeric);
        if (UnknownCurrency.is(found))
            throw new UnknownCurrencyError(String(numeric).slice(0, 32));
        return found;
    }
    /** `Currency.fromNumeric` for outside values: returns `UnknownCurrency` instead of throwing. */
    static parseNumeric(numeric) {
        const key = typeof numeric === 'number' ? String(numeric).padStart(3, '0') : numeric;
        if (byNumeric === undefined) {
            byNumeric = new Map();
            for (const currency of Currency.table().values()) {
                if (currency.numeric !== undefined)
                    byNumeric.set(currency.numeric, currency);
            }
        }
        return byNumeric.get(key) ?? UnknownCurrency();
    }
    /**
     * A currency that is not in ISO 4217: crypto, loyalty points, a withdrawn
     * currency you still hold data in. It is not registered anywhere; keep the
     * object and pass it where you would pass a code. Two custom currencies with
     * the same code and scale are treated as the same currency.
     */
    static custom(definition) {
        const { code, scale, numeric } = definition;
        if (typeof code !== 'string' || !CUSTOM_CODE.test(code)) {
            throw new InvalidArgumentError(`A currency code is 1–32 letters, digits or ". _ : -", starting with a letter; got ${JSON.stringify(code)}`);
        }
        if (Currency.table().has(code)) {
            throw new InvalidArgumentError(`${code} is an ISO 4217 currency; use Currency.of('${code}')`);
        }
        if (!Number.isInteger(scale) || scale < 0 || scale > MAX_SCALE) {
            throw new InvalidArgumentError(`A currency scale is a whole number from 0 to ${MAX_SCALE}, got ${scale}`);
        }
        if (numeric !== undefined && !/^\d{3}$/.test(numeric)) {
            throw new InvalidArgumentError(`A numeric currency code has three digits, got ${JSON.stringify(numeric)}`);
        }
        return new Currency(code, numeric, scale, false, BRAND);
    }
    /** `true` when `code` is in the shipped ISO 4217 table. */
    static isKnown(code) {
        return Currency.table().has(code);
    }
    /** Every ISO 4217 code in the shipped table, sorted. */
    static codes() {
        return [...Currency.table().keys()];
    }
    /** Same code and same scale. */
    eq(other) {
        return this === other || (this.code === other.code && this.scale === other.scale);
    }
    toString() {
        return this.code;
    }
    toJSON() {
        return this.code;
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Currency(${this.code})`;
    }
    [Symbol.for('Deno.customInspect')]() {
        return `Currency(${this.code})`;
    }
    /** Decodes the packed table on first use. */
    static table() {
        if (byCode !== undefined)
            return byCode;
        const table = new Map();
        for (let i = 0; i < ISO_4217.length; i += 7) {
            const code = ISO_4217.slice(i, i + 3);
            const digit = ISO_4217.charAt(i + 6);
            table.set(code, new Currency(code, ISO_4217.slice(i + 3, i + 6), digit === '-' ? 0 : Number(digit), true, BRAND));
        }
        byCode = table;
        return table;
    }
}
function hasCode(currency, code) {
    return currency.code === code;
}
/** Accepts a `Currency` or an ISO code. */
export function toCurrency(currency) {
    if (currency instanceof Currency)
        return currency;
    if (typeof currency !== 'string')
        throw new TypeError('Expected a currency code or a Currency');
    return Currency.of(currency);
}
/** `Currency.parse` for a builder: throws `UnknownCurrencyError` with the code cut to 32 characters. */
export function requireCurrency(code, custom) {
    const found = Currency.parse(code, custom);
    if (UnknownCurrency.is(found))
        throw new UnknownCurrencyError(code.slice(0, 32));
    return found;
}
/** Throws `CurrencyMismatchError` unless the two are the same currency. */
export function assertSameCurrency(a, b) {
    if (a !== b && (a.code !== b.code || a.scale !== b.scale))
        throw new CurrencyMismatchError(a.code, b.code);
}
//# sourceMappingURL=currency.js.map
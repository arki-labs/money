/**
 * Localized display through `Intl.NumberFormat`. The amount reaches `Intl` as
 * exact decimal text, never as a float, so digits past 2^53 survive on runtimes
 * that support string input (ES2023). Where a runtime lacks a feature you asked
 * for (React Native's Hermes on iOS lacks some), the call throws
 * `UnsupportedFeatureError` instead of quietly printing something else.
 *
 * Rounding for display is done exactly by this package, not by `Intl`, so it
 * matches arithmetic rounding everywhere.
 */
import { UnsupportedFeatureError } from '@arki/math/errors';
const CACHE_LIMIT = 64;
const cache = new Map();
let exactStrings;
function isNumericText(text) {
    return /^-?\d+(?:\.\d+)?$/.test(text);
}
/** Whether `format('9007199254740993')` keeps every digit (ES2023 string input). */
function supportsExactStrings() {
    if (exactStrings === undefined) {
        try {
            exactStrings =
                new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 0 }).format('9007199254740993') ===
                    '9007199254740993';
        }
        catch {
            exactStrings = false;
        }
    }
    return exactStrings;
}
function formatterFor(money, options, digits) {
    const currency = money.currency;
    const locale = options.locale ?? 'en-US';
    const display = options.display ?? (currency.iso ? 'symbol' : 'code');
    if (!currency.iso && display !== 'code') {
        throw new UnsupportedFeatureError(`${currency.code} is a custom currency; only display: 'code' is available`);
    }
    const key = `${locale}|${currency.iso ? currency.code : ''}|${display}|${options.accounting === true ? 1 : 0}|${options.signDisplay ?? ''}|${options.useGrouping === false ? 0 : 1}|${digits}`;
    const cached = cache.get(key);
    if (cached !== undefined)
        return cached;
    const intlOptions = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping: options.useGrouping !== false,
    };
    if (currency.iso) {
        intlOptions.style = 'currency';
        intlOptions.currency = currency.code;
        intlOptions.currencyDisplay = display;
        if (options.accounting === true)
            intlOptions.currencySign = 'accounting';
    }
    if (options.signDisplay !== undefined)
        intlOptions.signDisplay = options.signDisplay;
    let formatter;
    try {
        formatter = new Intl.NumberFormat(locale, intlOptions);
    }
    catch (error) {
        throw new UnsupportedFeatureError(`This runtime's Intl cannot format with these options`, { cause: error });
    }
    const resolved = formatter.resolvedOptions();
    if (options.accounting === true && resolved.currencySign !== 'accounting') {
        throw new UnsupportedFeatureError('This runtime does not support accounting currency format');
    }
    if (options.signDisplay !== undefined && resolved.signDisplay !== options.signDisplay) {
        throw new UnsupportedFeatureError(`This runtime does not support signDisplay: '${options.signDisplay}'`);
    }
    if (resolved.maximumFractionDigits !== digits) {
        throw new UnsupportedFeatureError(`This runtime cannot show ${digits} decimals`);
    }
    if (cache.size >= CACHE_LIMIT)
        cache.clear();
    cache.set(key, formatter);
    return formatter;
}
function prepare(money, options) {
    const digits = options.fractionDigits ?? money.scale;
    const shown = digits === money.scale ? money : money.toScale(digits, options.rounding);
    const formatter = formatterFor(shown, options, digits);
    const text = shown.toDecimalString();
    if (!isNumericText(text))
        throw new TypeError(`Unexpected decimal text ${text}`);
    if (supportsExactStrings())
        return [formatter, text];
    // Without string input, Intl converts to a double; up to 15 significant digits survive that exactly.
    if (text.replaceAll(/[-.]/g, '').replace(/^0+/, '').length > 15) {
        throw new UnsupportedFeatureError('This runtime cannot format more than 15 significant digits exactly');
    }
    return [formatter, Number(text)];
}
/**
 * `formatMoney(money('1234.5', 'EUR'), { locale: 'de-DE' })` → `'1.234,50 €'`.
 * Custom currencies print the number and the code: `'0.00012000 BTC'`.
 */
export function formatMoney(money, options = {}) {
    const [formatter, value] = prepare(money, options);
    const text = formatter.format(value);
    return money.currency.iso ? text : `${text} ${money.currency.code}`;
}
/** The parts `Intl` produces (currency, integer, group, decimal, fraction, ...), for custom rendering. */
export function formatMoneyToParts(money, options = {}) {
    const [formatter, value] = prepare(money, options);
    if (typeof formatter.formatToParts !== 'function') {
        throw new UnsupportedFeatureError('This runtime does not support Intl.NumberFormat#formatToParts');
    }
    const parts = formatter.formatToParts(value);
    if (!money.currency.iso)
        parts.push({ type: 'literal', value: ' ' }, { type: 'currency', value: money.currency.code });
    return parts;
}
/** Binds options once for loops: `const eur = createMoneyFormatter({ locale: 'de-DE' }); eur.format(price)`. */
export function createMoneyFormatter(options = {}) {
    const bound = { ...options };
    return {
        format: money => formatMoney(money, bound),
        formatToParts: money => formatMoneyToParts(money, bound),
    };
}
//# sourceMappingURL=format.js.map
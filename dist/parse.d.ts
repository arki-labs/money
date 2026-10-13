/**
 * Strict parsing of money typed by people: `'1.234,56 €'` in German,
 * `'$1,234.56'` in English, `'₹1,23,456.78'` in Indian English.
 *
 * The locale's separators, digits, minus sign and currency symbols come from
 * `Intl.NumberFormat#formatToParts`. You always say which currency you expect,
 * so `'$10'` never has to guess between US, Canadian or Australian dollars.
 *
 * Strict means it refuses instead of guessing: grouping in the wrong place
 * (`'1,23,4'`), a decimal separator the locale does not use, two signs, mixed
 * digit scripts, a different currency's symbol, or any trailing text all throw
 * `NumberFormatError`. Text without grouping is always fine: `'1234.5'`.
 *
 * Runtimes without `formatToParts` (React Native's Hermes on iOS) throw
 * `UnsupportedFeatureError`; pass `symbols` to parse without `Intl`.
 */
import type { RoundingMode } from '@arki/math/rounding';
import type { CurrencyLike } from './currency.js';
import { Money } from './money.js';
export type ParseSymbols = {
    /** Decimal separator, such as `','`. */
    decimal: string;
    /** Group separator, such as `'.'`. Omit when the input never has grouping. */
    group?: string;
    /** Digits per group: `[3]` for most locales, `[3, 2]` for Indian grouping. Defaults to `[3]`. */
    groupSizes?: readonly [primary: number, secondary?: number];
    /** Currency marks to accept besides the code, such as `['€']`. */
    currency?: readonly string[];
};
export type ParseOptions = {
    /** BCP 47 locale. Defaults to `'en-US'`; there is no global locale. */
    locale?: string;
    /** How to drop digits beyond the scale. Without it, extra digits throw `RoundingNecessaryError`. */
    rounding?: RoundingMode;
    /** Decimals to keep. Defaults to the currency's. */
    scale?: number;
    /** Separators to use instead of asking `Intl`, for runtimes without `formatToParts`. */
    symbols?: ParseSymbols;
};
export type MoneyParser<C extends string> = {
    /** Parses or throws `NumberFormatError` (bad text) or `RoundingNecessaryError` (too many decimals). */
    parse(text: string): Money<C>;
    /** Parses or returns `undefined`, for form validation. Still throws for runtime capability errors. */
    tryParse(text: string): Money<C> | undefined;
};
/**
 * Prepares the locale's grammar once, for forms and imports:
 * `const parse = createMoneyParser('EUR', { locale: 'de-DE' }); parse.parse('1.234,56 €')`.
 */
export declare function createMoneyParser<const C extends string>(currency: CurrencyLike<C>, options?: ParseOptions): MoneyParser<C>;
/** One-shot form of `createMoneyParser`: `parseMoney('1.234,56 €', 'EUR', { locale: 'de-DE' })`. */
export declare function parseMoney<const C extends string>(text: string, currency: CurrencyLike<C>, options?: ParseOptions): Money<C>;
//# sourceMappingURL=parse.d.ts.map
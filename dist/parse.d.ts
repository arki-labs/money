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
 * digit scripts, a different currency's symbol, or any trailing text all return
 * the `InvalidMoneyText` failure. Text without grouping is always fine: `'1234.5'`.
 * Parsing never throws for bad text: it returns a failure from `failures.ts`.
 *
 * A locale tag the runtime rejects returns `UnsupportedLocale`. Runtimes without
 * `formatToParts` (React Native's Hermes on iOS) throw `UnsupportedFeatureError`;
 * pass `symbols` to parse without `Intl`.
 */
import type { RoundingMode } from '@arki/math/rounding';
import type { Currency, CurrencyLike } from './currency.js';
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
    /** How to drop digits beyond the scale. Without it, extra digits return `RoundingNecessary`. */
    rounding?: RoundingMode;
    /** Decimals to keep. Defaults to the currency's. */
    scale?: number;
    /** Separators to use instead of asking `Intl`, for runtimes without `formatToParts`. */
    symbols?: ParseSymbols;
};
export type MoneyParser<C extends string> = {
    /** The amount, or `InvalidMoneyText`, `InputTooLarge` or `RoundingNecessary` (too many decimals). Never throws for bad text. */
    parse(text: string): ReturnType<typeof parseWith<C>>;
};
type Grammar = {
    decimal: string;
    group: string | undefined;
    primary: number;
    secondary: number;
    /** The locale's ten digits, or `undefined` for ASCII digits. */
    digits: string | undefined;
    minus: readonly string[];
    /** Currency marks, longest first. */
    marks: readonly string[];
};
/** Reads one text with a prepared grammar. Its return type is `MoneyParser#parse`'s. */
declare function parseWith<C extends string>(text: string, grammar: Grammar, currency: Currency<C>, scale: number, rounding: RoundingMode | undefined): import("@arki/failure").Failure<"money.input_too_large", undefined> | import("@arki/failure").Failure<"money.invalid_text", undefined> | import("@arki/failure").Failure<"money.rounding_necessary", undefined> | import("./money.js").Money<C>;
/**
 * Prepares the locale's grammar once, for forms and imports:
 * `const parser = createMoneyParser('EUR', { locale: 'de-DE' }); parser.parse('1.234,56 €')`.
 * Returns `UnsupportedLocale` when the runtime rejects `options.locale`, which often comes from
 * outside (`Accept-Language`). The currency and scale are your code's: an unknown code or a
 * bad scale throws.
 */
export declare function createMoneyParser<const C extends string>(currency: CurrencyLike<C>, options?: ParseOptions): import("@arki/failure").Failure<"money.unsupported_locale", undefined> | MoneyParser<C>;
/**
 * One-shot form of `createMoneyParser`: `parseMoney('1.234,56 €', 'EUR', { locale: 'de-DE' })`.
 * Returns the amount or a failure (`InvalidMoneyText`, `InputTooLarge`, `RoundingNecessary`,
 * `UnsupportedLocale`); it never throws for bad text.
 */
export declare function parseMoney<const C extends string>(text: string, currency: CurrencyLike<C>, options?: ParseOptions): import("@arki/failure").Failure<"money.input_too_large", undefined> | import("@arki/failure").Failure<"money.invalid_text", undefined> | import("@arki/failure").Failure<"money.rounding_necessary", undefined> | import("@arki/failure").Failure<"money.unsupported_locale", undefined> | import("./money.js").Money<C>;
export {};
//# sourceMappingURL=parse.d.ts.map
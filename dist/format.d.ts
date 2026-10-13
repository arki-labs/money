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
import type { RoundingMode } from '@arki/math/rounding';
import type { Money } from './money.js';
export type FormatOptions = {
    /** BCP 47 locale. Defaults to `'en-US'`; there is no global locale. */
    locale?: string;
    /** How to show the currency. Defaults to `'symbol'` for ISO currencies and `'code'` for custom ones. */
    display?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
    /** `($5.00)` instead of `-$5.00` where the locale has an accounting style. */
    accounting?: boolean;
    signDisplay?: 'auto' | 'always' | 'exceptZero' | 'negative' | 'never';
    /** Defaults to `true`. */
    useGrouping?: boolean;
    /** Decimals to show. Defaults to the amount's scale, so nothing is hidden. */
    fractionDigits?: number;
    /** Needed when `fractionDigits` drops non-zero digits. */
    rounding?: RoundingMode;
};
export type MoneyFormatter = {
    format(money: Money): string;
    formatToParts(money: Money): Intl.NumberFormatPart[];
};
/**
 * `formatMoney(money('1234.5', 'EUR'), { locale: 'de-DE' })` → `'1.234,50 €'`.
 * Custom currencies print the number and the code: `'0.00012000 BTC'`.
 */
export declare function formatMoney(money: Money, options?: FormatOptions): string;
/** The parts `Intl` produces (currency, integer, group, decimal, fraction, ...), for custom rendering. */
export declare function formatMoneyToParts(money: Money, options?: FormatOptions): Intl.NumberFormatPart[];
/** Binds options once for loops: `const eur = createMoneyFormatter({ locale: 'de-DE' }); eur.format(price)`. */
export declare function createMoneyFormatter(options?: FormatOptions): MoneyFormatter;
//# sourceMappingURL=format.d.ts.map
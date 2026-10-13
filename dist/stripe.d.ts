/**
 * Stripe amounts. Stripe sends integers in its own units, which differ from
 * ISO 4217 for some currencies. Rules from docs.stripe.com/currencies, read
 * on 2026-10-12:
 *
 * - Zero-decimal: BIF CLP DJF GNF JPY KMF KRW MGA PYG RWF VND VUV XAF XOF XPF
 *   (`500` is 500 JPY). MGA has 2 decimals in ISO but 0 at Stripe.
 * - ISK and UGX: sent with two decimals that are always `00` (`500` is 5 ISK).
 * - HUF and TWD: two-decimal charges; payouts must be divisible by 100.
 * - Other currencies with 2 ISO decimals: two decimals.
 *
 * Stripe documents no rule for currencies with 3 or 4 ISO decimals, so those
 * throw `ProviderAmountError` instead of being guessed. Whether your account
 * can charge a currency, and its minimum and maximum amounts, are Stripe's to
 * enforce; this module only gets the units right.
 */
import type { Currency, CurrencyLike } from './currency.js';
import type { Money } from './money.js';
import type { ProviderUnitRule } from './provider.js';
/** When Stripe's rules in this module were last checked. */
export declare const STRIPE_RULES_VERSION = "2026-10-12";
export type StripeOperation = 'charge' | 'payout';
/** Stripe's unit rule for a currency and operation. Throws `ProviderAmountError` where Stripe documents none. */
export declare function stripeRule(currency: CurrencyLike, operation?: StripeOperation): ProviderUnitRule;
/**
 * `toStripeAmount(money('10.99', 'USD'))` → `1099`; `money(5, 'ISK')` → `500`.
 * Throws `ProviderAmountError` for a negative amount or one Stripe cannot express (`10.50 MGA`).
 */
export declare function toStripeAmount(amount: Money, operation?: StripeOperation): number;
/** `fromStripeAmount(1099, 'usd')` → `10.99 USD`. Accepts Stripe's lower-case codes. */
export declare function fromStripeAmount(amount: number | bigint | string, currency: string | Currency, operation?: StripeOperation): Money;
/** The `{ amount, currency }` pair a Stripe request takes: `{ amount: 1099, currency: 'usd' }`. */
export declare function toStripe(amount: Money, operation?: StripeOperation): {
    amount: number;
    currency: string;
};
//# sourceMappingURL=stripe.d.ts.map
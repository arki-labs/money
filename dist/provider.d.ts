/**
 * Payment providers count amounts in their own units, which are not always
 * ISO's. A rule says how many decimals the provider's integer carries and,
 * optionally, which multiple it must be. Conversion never rounds: an amount
 * the provider cannot express throws `ProviderAmountError`.
 *
 * `@arki/money/stripe` ships Stripe's rules. Describe any other provider with
 * a `ProviderUnitRule` and these two functions.
 */
import type { CurrencyLike } from './currency.js';
import { Money } from './money.js';
export type ProviderUnitRule = {
    /** Decimals in the provider's integer: 2 means `1099` is `10.99`. */
    scale: number;
    /** The integer must be a multiple of this: `100` for whole-unit-only currencies sent with two decimals. */
    step?: number;
};
/** `toProviderUnits(money('10.99', 'USD'), { scale: 2 })` → `1099`. Throws instead of rounding. */
export declare function toProviderUnits(amount: Money, rule: ProviderUnitRule): number;
/** The reverse of `toProviderUnits`, at the currency's own scale. Validates the step. */
export declare function fromProviderUnits<const C extends string>(units: number | bigint | string, currency: CurrencyLike<C>, rule: ProviderUnitRule): Money<C>;
//# sourceMappingURL=provider.d.ts.map
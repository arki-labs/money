/**
 * Payment providers count amounts in their own units, which are not always
 * ISO's. A rule says how many decimals the provider's integer carries and,
 * optionally, which multiple it must be. Conversion never rounds.
 *
 * Sending (`toProviderUnits`) takes your own `Money`, so an amount the provider
 * cannot express throws `ProviderAmountError`. Reading (`fromProviderUnits`)
 * takes the provider's payload, so it returns a failure instead of throwing.
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
/** `toProviderUnits(money('10.99', 'USD'), { scale: 2 })` → `1099`. Throws `ProviderAmountError` instead of rounding. */
export declare function toProviderUnits(amount: Money, rule: ProviderUnitRule): number;
/**
 * The reverse of `toProviderUnits`, at the currency's own scale, for a provider's payload.
 * Returns `ProviderAmount` (off the step, or a fraction the currency lacks), `UnknownCurrency`,
 * `AmountOutOfRange`, `InputTooLarge` or `InvalidMoneyText` instead of throwing. The rule is
 * your code's: a bad rule throws `InvalidArgumentError`.
 */
export declare function fromProviderUnits<const C extends string>(units: number | bigint | string, currency: CurrencyLike<C>, rule: ProviderUnitRule): import("@arki/failure").Failure<"money.input_too_large", undefined> | import("@arki/failure").Failure<"money.invalid_text", undefined> | import("@arki/failure").Failure<"money.out_of_range", undefined> | import("@arki/failure").Failure<"money.provider_amount", undefined> | import("@arki/failure").Failure<"money.unknown_currency", undefined> | Money<C>;
//# sourceMappingURL=provider.d.ts.map
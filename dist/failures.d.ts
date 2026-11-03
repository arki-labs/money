/**
 * Values that come from outside (typed text, JSON, database rows, provider
 * payloads) are read by `parse*` doors that return one of these failures
 * instead of throwing. Builders and arithmetic keep their thrown errors
 * (`errors.ts`), because their input is the caller's own code.
 *
 * Failures carry no input text: the caller already holds it, and a failure
 * may be logged or sent to a client. Match on `code`, never on the message.
 */
/**
 * The text is not an amount of money in the expected format: wrong characters,
 * misplaced grouping, a different currency's symbol, two signs, mixed digit scripts.
 *
 * @fix Show the person the expected format, for example `19.99 EUR`. Do not guess a repair.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const InvalidMoneyText: import("@arki/failure").FailureDefinition<"money.invalid_text", undefined>;
/**
 * The value has a different shape than `{ amount: string, currency: string }`.
 *
 * @fix Send `{ amount, currency }` with both fields as strings, as `Money#toJSON()` writes them.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const InvalidMoneyShape: import("@arki/failure").FailureDefinition<"money.invalid_shape", undefined>;
/**
 * The currency code or number is not in the ISO 4217 table and no custom currency was listed for it.
 * Thrown builders raise `UnknownCurrencyError` (`ARKI_MONEY_E002`) for the same fault.
 *
 * @fix Use an ISO 4217 code in upper case, or pass the custom `Currency` objects you accept.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const UnknownCurrency: import("@arki/failure").FailureDefinition<"money.unknown_currency", undefined>;
/**
 * The amount has more decimals than the currency or scale allows, and no rounding mode was given.
 *
 * @fix Ask for an amount with fewer decimals, or pass an explicit `rounding` mode to the parser.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const RoundingNecessary: import("@arki/failure").FailureDefinition<"money.rounding_necessary", undefined>;
/**
 * A number is not a safe whole number of minor units: it is fractional, not finite, or past 2^53.
 *
 * @fix Send minor units as a string or bigint when they may pass 2^53, and never send a fraction.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const AmountOutOfRange: import("@arki/failure").FailureDefinition<"money.out_of_range", undefined>;
/**
 * The input is longer than the package reads: text over 1000 characters, an exponent or fraction
 * that is too large, or a number with more than about 10 000 digits.
 *
 * @fix Refuse the input at your boundary. Real amounts are far shorter than these limits.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const InputTooLarge: import("@arki/failure").FailureDefinition<"money.input_too_large", undefined>;
/**
 * The locale tag is not valid, so the runtime's `Intl` cannot give its number format.
 *
 * @fix Pass a well-formed BCP 47 tag such as `de-DE`, or pass `symbols` to parse without `Intl`.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const UnsupportedLocale: import("@arki/failure").FailureDefinition<"money.unsupported_locale", undefined>;
/**
 * A payment provider amount cannot be read as money: it is not a multiple of the provider's step,
 * it carries a fraction the currency does not have, or the provider has no unit rule for the currency.
 *
 * @fix Check the provider's amount and currency. Never round a provider amount to make it fit.
 * @verify cd packages/money && bun run vitest run src/failures.test.ts
 */
export declare const ProviderAmount: import("@arki/failure").FailureDefinition<"money.provider_amount", undefined>;
/**
 * A rate read from a feed is not usable: it is zero or negative, or a rate from a currency
 * to itself is not 1. Thrown builders raise `ExchangeRateError` for the same fault.
 *
 * @fix Check the feed. A rate is how many units of the quote currency one unit of the base buys, always above 0.
 * @verify cd packages/money && bun run vitest run src/exchange.test.ts
 */
export declare const InvalidExchangeRate: import("@arki/failure").FailureDefinition<"money.invalid_rate", undefined>;
/** Every failure a `parse*` door of this package can return. */
export declare const MONEY_FAILURES: readonly [import("@arki/failure").FailureDefinition<"money.invalid_text", undefined>, import("@arki/failure").FailureDefinition<"money.invalid_shape", undefined>, import("@arki/failure").FailureDefinition<"money.unknown_currency", undefined>, import("@arki/failure").FailureDefinition<"money.rounding_necessary", undefined>, import("@arki/failure").FailureDefinition<"money.out_of_range", undefined>, import("@arki/failure").FailureDefinition<"money.input_too_large", undefined>, import("@arki/failure").FailureDefinition<"money.unsupported_locale", undefined>, import("@arki/failure").FailureDefinition<"money.provider_amount", undefined>, import("@arki/failure").FailureDefinition<"money.invalid_rate", undefined>];
/** The code of every failure in {@link MONEY_FAILURES}, derived from the definitions. */
export type MoneyFailureCode = (typeof MONEY_FAILURES)[number]['code'];
/** A failure value returned by a money door. */
export type MoneyFailure = ReturnType<(typeof MONEY_FAILURES)[number]>;
/** Whether a value is one of the failures in {@link MONEY_FAILURES}. */
export declare function isMoneyFailure(value: unknown): value is MoneyFailure;
//# sourceMappingURL=failures.d.ts.map
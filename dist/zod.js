/**
 * Zod 4 schemas that turn input into `Money`. Optional: needs `zod` installed.
 *
 * ```ts
 * const order = z.object({ total: moneySchema('EUR', { min: money(0, 'EUR') }) });
 * order.parse({ total: { amount: '19.99', currency: 'EUR' } }).total; // Money<'EUR'>
 * ```
 *
 * The input type is the JSON shape `{ amount: string; currency: string }`, so
 * RPC clients (tRPC, oRPC) infer what to send; the output type is `Money`.
 */
import { z } from 'zod';
import { Currency, resolveCurrency, toCurrency } from './currency.js';
import { MathError } from './errors.js';
import { Money as MoneyClass } from './money.js';
import { createMoneyParser } from './parse.js';
function message(error) {
    return error instanceof Error ? error.message : 'Invalid money';
}
function checkBounds(value, options, ctx) {
    if (options.min !== undefined && value.lt(options.min)) {
        ctx.addIssue({ code: 'custom', message: `Must be at least ${options.min.toString()}` });
    }
    if (options.max !== undefined && value.gt(options.max)) {
        ctx.addIssue({ code: 'custom', message: `Must be at most ${options.max.toString()}` });
    }
}
const moneyJsonShape = z.object({ amount: z.string(), currency: z.string() });
function settle(amount, currency, options, ctx) {
    try {
        const value = MoneyClass.of(amount, currency, { rounding: options.rounding });
        checkBounds(value, options, ctx);
        return value;
    }
    catch (error) {
        if (!(error instanceof MathError))
            throw error;
        ctx.addIssue({ code: 'custom', message: message(error), path: ['amount'] });
        return z.NEVER;
    }
}
/**
 * `{ amount: '19.99', currency: 'EUR' }` → `Money<'EUR'>`. Another currency,
 * a bad amount or a value out of bounds becomes a Zod issue.
 */
export function moneySchema(currency, options = {}) {
    const expected = toCurrency(currency);
    return moneyJsonShape.transform((input, ctx) => {
        if (input.currency !== expected.code) {
            ctx.addIssue({ code: 'custom', message: `Expected ${expected.code}, got ${input.currency}`, path: ['currency'] });
            return z.NEVER;
        }
        return settle(input.amount, expected, options, ctx);
    });
}
/** `{ amount, currency }` in any ISO (or listed custom) currency → `Money`. */
export function anyMoneySchema(options = {}) {
    return moneyJsonShape.transform((input, ctx) => {
        let currency;
        try {
            currency = resolveCurrency(input.currency, options.currencies);
        }
        catch (error) {
            if (!(error instanceof MathError))
                throw error;
            ctx.addIssue({ code: 'custom', message: message(error), path: ['currency'] });
            return z.NEVER;
        }
        return settle(input.amount, currency, options, ctx);
    });
}
/**
 * A form field: locale text such as `'1.234,56 €'` → `Money<C>`, with the
 * strict rules of `@arki/money/parse`.
 */
export function moneyInputSchema(currency, options = {}) {
    const parser = createMoneyParser(currency, options);
    return z.string().transform((text, ctx) => {
        try {
            const value = parser.parse(text);
            checkBounds(value, options, ctx);
            return value;
        }
        catch (error) {
            if (!(error instanceof MathError))
                throw error;
            ctx.addIssue({ code: 'custom', message: message(error) });
            return z.NEVER;
        }
    });
}
/** An ISO 4217 code from the shipped table, such as `'EUR'`. */
export const currencyCodeSchema = z
    .string()
    .refine(code => Currency.isKnown(code), { message: 'Unknown ISO 4217 currency code' });
//# sourceMappingURL=zod.js.map
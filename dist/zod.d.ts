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
import type { CurrencyLike } from './currency.js';
import type { Money, MoneyOptions } from './money.js';
import type { ParseOptions } from './parse.js';
import { Currency } from './currency.js';
export type MoneySchemaOptions<C extends string> = {
    /** Inclusive bounds. */
    min?: Money<C>;
    max?: Money<C>;
    /** Extra digits are rounded with this mode instead of rejected. */
    rounding?: MoneyOptions['rounding'];
};
export type AnyMoneySchemaOptions = MoneySchemaOptions<string> & {
    /** Custom currencies to resolve by code. */
    currencies?: readonly Currency[];
};
/**
 * `{ amount: '19.99', currency: 'EUR' }` → `Money<'EUR'>`. Another currency,
 * a bad amount or a value out of bounds becomes a Zod issue.
 */
export declare function moneySchema<const C extends string>(currency: CurrencyLike<C>, options?: MoneySchemaOptions<C>): z.ZodPipe<z.ZodObject<{
    amount: z.ZodString;
    currency: z.ZodString;
}, z.core.$strip>, z.ZodTransform<Money<C>, {
    amount: string;
    currency: string;
}>>;
/** `{ amount, currency }` in any ISO (or listed custom) currency → `Money`. */
export declare function anyMoneySchema(options?: AnyMoneySchemaOptions): z.ZodPipe<z.ZodObject<{
    amount: z.ZodString;
    currency: z.ZodString;
}, z.core.$strip>, z.ZodTransform<Money<string>, {
    amount: string;
    currency: string;
}>>;
/**
 * A form field: locale text such as `'1.234,56 €'` → `Money<C>`, with the
 * strict rules of `@arki/money/parse`. A locale the runtime rejects throws here, when the
 * schema is built: the schema is your code's.
 */
export declare function moneyInputSchema<const C extends string>(currency: CurrencyLike<C>, options?: ParseOptions & Pick<MoneySchemaOptions<C>, 'min' | 'max'>): z.ZodPipe<z.ZodString, z.ZodTransform<Money<C>, string>>;
/** An ISO 4217 code from the shipped table, such as `'EUR'`. */
export declare const currencyCodeSchema: z.ZodString;
//# sourceMappingURL=zod.d.ts.map
/**
 * Bridges to `@arki/math`'s exact types, for multi-step math that should
 * round only once at the end:
 *
 * ```ts
 * const share = toRational(price).times(ratio(1, 3)).plus(ratio(1, 7));
 * Money.of(share, 'EUR', { rounding: 'halfEven' }); // Money.of reads Decimal and Rational directly
 * ```
 *
 * Kept in its own entry point so the core never loads the `Decimal` and
 * `Rational` classes.
 */
import type { Decimal } from '@arki/math/decimal';
import type { Rational } from '@arki/math/rational';
import type { Money } from './money.js';
/** `19.99 EUR` → `Decimal('19.99')`, keeping the scale. */
export declare function toDecimal(money: Money): Decimal;
/** `19.99 EUR` → `1999/100`, reduced. */
export declare function toRational(money: Money): Rational;
//# sourceMappingURL=exact.d.ts.map
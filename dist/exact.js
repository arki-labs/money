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
import { decimal } from '@arki/math/decimal';
import { ratio } from '@arki/math/rational';
/** `19.99 EUR` → `Decimal('19.99')`, keeping the scale. */
export function toDecimal(money) {
    return decimal(money.toDecimalString());
}
/** `19.99 EUR` → `1999/100`, reduced. */
export function toRational(money) {
    return ratio(BigInt(money.units), 10n ** BigInt(money.scale));
}
//# sourceMappingURL=exact.js.map
/**
 * Builders and arithmetic throw; the `parse*` doors return. Both read the same
 * text, so a builder asks the door and raises the matching thrown error.
 */
import type { MoneyFailure } from '../failures.js';
/** The thrown error a builder raises for a failure. */
export declare function failureToError(failure: MoneyFailure): Error;
/** The value, or the thrown error for a returned failure. For builders, whose input is the caller's own code; not `@arki/failure`'s `orThrow`, which throws `FailureError`. */
export declare function orRaise<T>(value: T | MoneyFailure): T;
//# sourceMappingURL=raise.d.ts.map
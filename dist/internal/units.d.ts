/**
 * Whole-unit arithmetic. An amount is a count of whole units, held as a plain
 * `number` while it is a safe integer and as a `bigint` beyond that. Each value
 * has exactly one of the two forms ("canonical form"): a `number` if and only
 * if it is a safe integer, never `-0`.
 *
 * Plain numbers are several times faster than `bigint` on every engine, and
 * 2^53 cents is 90 trillion in a two-decimal currency, so almost every program
 * stays on the number path. The `bigint` path keeps the rest exact.
 */
import type { RoundingMode } from '@arki/math/rounding';
export type Units = number | bigint;
/** Largest number of decimals a `Money` or a custom currency may have. */
export declare const MAX_SCALE = 100;
/** Longest amount string that is parsed. */
export declare const MAX_INPUT_LENGTH = 1000;
/** Largest number of parts `allocate` and `split` produce. */
export declare const MAX_PARTS = 10000;
/** Brings a `bigint` to canonical form. */
export declare function canon(value: bigint): Units;
/** `10^exponent` in canonical form. `exponent` is a small non-negative integer. */
export declare function pow10(exponent: number): Units;
/** Exact sum. */
export declare function addUnits(a: Units, b: Units): Units;
/** Exact product. */
export declare function mulUnits(a: Units, b: Units): Units;
export declare function negUnits(a: Units): Units;
/** `-1`, `0` or `1`. Mixed `number`/`bigint` comparison is exact in JavaScript. */
export declare function compareUnits(a: Units, b: Units): -1 | 0 | 1;
/**
 * `units × numerator ÷ denominator` as a whole number, rounded with `mode`.
 * `denominator` must be positive. With no mode (or `'unnecessary'`) an inexact
 * result throws `RoundingNecessaryError`. Every operation that can lose digits
 * reduces to this call.
 */
export declare function mulDiv(units: Units, numerator: Units, denominator: Units, mode?: RoundingMode): Units;
/**
 * Brings `coefficient × 10^-fraction` onto the grid of `scale` decimals, and
 * onto multiples of `step` units when a step is given. Rounds once, never
 * first to the scale and then to the step.
 */
export declare function quantize(coefficient: Units, fraction: number, scale: number, mode?: RoundingMode, step?: Units): Units;
/** A decimal read from text: `coefficient × 10^-fraction`, with `fraction >= 0`. */
export type Parsed = {
    coefficient: Units;
    fraction: number;
};
/**
 * Reads plain decimal text: an optional sign, digits, an optional fraction, an
 * optional exponent. No grouping, no spaces, no `Infinity`. Throws
 * `NumberFormatError` otherwise.
 */
export declare function parseDecimal(text: string): Parsed;
/**
 * Reads a JS number through its shortest decimal spelling, so `19.99` means
 * exactly 19.99 — what was typed, not the binary approximation. It cannot undo
 * earlier float arithmetic: `0.1 + 0.2` arrives as `0.30000000000000004`.
 */
export declare function parseNumber(value: number): Parsed;
/** Throws `DivisionByZeroError` for a zero divisor. */
export declare function assertNonZero(value: Units): void;
/** Greatest common divisor of two non-negative values, in canonical form. */
export declare function gcdUnits(a: Units, b: Units): Units;
/** `a / b` for a `b` known to divide `a` exactly. */
export declare function divExact(a: Units, b: Units): Units;
//# sourceMappingURL=units.d.ts.map
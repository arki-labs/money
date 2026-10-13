/** Column options shared by every SQL dialect. */
import { toCurrency } from '../currency.js';
import { InvalidArgumentError } from '../errors.js';
import { MAX_SCALE } from '../internal/units.js';
/** Validates a column config once, when the table is defined. */
export function resolveColumn(config, column) {
    if (config === undefined)
        throw new InvalidArgumentError(`${column} needs a config with a currency`);
    const currency = toCurrency(config.currency);
    const scale = config.scale ?? currency.scale;
    if (!Number.isInteger(scale) || scale < 0 || scale > MAX_SCALE) {
        throw new InvalidArgumentError(`${column}: scale must be a whole number from 0 to ${MAX_SCALE}, got ${scale}`);
    }
    return { currency, scale };
}
//# sourceMappingURL=config.js.map
/**
 * A wallet of several currencies: `10 EUR + 5 USD` stays two balances. It never
 * pretends mixed amounts have one total until you convert it, and then it
 * converts each balance exactly and rounds once.
 *
 * ```ts
 * const cart = MoneyBag.of(money(10, 'EUR'), money(5, 'USD')).plus(money('2.50', 'EUR'));
 * cart.get('EUR').toString();                                   // '25/2 EUR'
 * cart.convert(fx, 'EUR', { rounding: 'halfEven' });            // one EUR total
 * ```
 */
import type { Currency, CurrencyLike } from './currency.js';
import type { Converter } from './exchange.js';
import type { MoneyJSON, MoneyOptions } from './money.js';
import type { ExactMoney } from './rational.js';
import { Money } from './money.js';
import { RationalMoney } from './rational.js';
/** An immutable set of balances, at most one per currency. Zero balances are dropped. */
export declare class MoneyBag {
    private readonly balances;
    private constructor();
    static empty(): MoneyBag;
    /** `MoneyBag.of(money(10, 'EUR'), money(5, 'USD'))`. */
    static of(...items: (ExactMoney | MoneyBag)[]): MoneyBag;
    /** Adds amounts or whole bags. Returns a new bag. */
    plus(...items: (ExactMoney | MoneyBag)[]): MoneyBag;
    /** Subtracts amounts or whole bags. Balances may go negative. Returns a new bag. */
    minus(...items: (ExactMoney | MoneyBag)[]): MoneyBag;
    /** The exact balance in one currency; zero when the bag holds none. */
    get<const C extends string>(currency: CurrencyLike<C>): RationalMoney<C>;
    /** The currencies with a non-zero balance, sorted by code. */
    currencies(): Currency[];
    /** The non-zero balances, sorted by currency code. */
    entries(): RationalMoney[];
    /** `true` when every balance is zero. */
    isZero(): boolean;
    /**
     * One total in `currency`: each balance is converted exactly, the results are
     * added, and the sum is rounded once. Missing rates throw `ExchangeRateError`.
     */
    convert<const C extends string>(converter: Converter, currency: CurrencyLike<C>, options?: MoneyOptions): Money<C>;
    /** `[{ amount: '25/2', currency: 'EUR' }, ...]`, sorted by currency code. */
    toJSON(): MoneyJSON[];
    /** `'12.5 EUR + 5 USD'`-style text with exact fractions: `'25/2 EUR + 5 USD'`. Empty bag: `'0'`. */
    toString(): string;
    private combine;
}
//# sourceMappingURL=bag.d.ts.map
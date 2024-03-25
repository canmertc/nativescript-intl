import { DateTimeFormat as commonDateTimeFormat, NumberFormat as commonNumberFormat, FULL } from "./nativescript-intl-common";
import { NumberFormatOptions } from "./nativescript-intl";
import getSymbolFromCurrency from "currency-symbol-map";

export class DateTimeFormat extends commonDateTimeFormat {
    public getNativePattern(patternDefinition: { date?: string; time?: string }, locale?: string): string {
        let dateFormatter = NSDateFormatter.new();
        if (locale) {
            dateFormatter.locale = NSLocale.alloc().initWithLocaleIdentifier(locale);
        }
        if (patternDefinition.date) {
            dateFormatter.dateStyle = patternDefinition.date === FULL ? NSDateFormatterStyle.FullStyle : NSDateFormatterStyle.ShortStyle;
        }
        if (patternDefinition.time) {
            dateFormatter.timeStyle = NSDateFormatterStyle.LongStyle;
        }
        return dateFormatter.dateFormat;
    }

    public formatNative(pattern: string, locale?: string, date?: Date): string {
        let dateFormatter = NSDateFormatter.new();
        if (locale) {
            dateFormatter.locale = NSLocale.alloc().initWithLocaleIdentifier(locale);
        }
        dateFormatter.dateFormat = pattern;
        // return dateFormatter.stringFromDate(date ?
        // NSDate.dateWithTimeIntervalSince1970(date.valueOf()/1000) :
        // NSDate.new());
        return dateFormatter.stringFromDate(date ? date : new Date());
    }
}

// style?: string;
// currency?: string;
// currencyDisplay?: string;
// useGrouping?: boolean;
// minimumIntegerDigits?: number;
// minimumFractionDigits?: number;
// maximumFractionDigits?: number;
export class NumberFormat extends commonNumberFormat {
    public numberFormat: NSNumberFormatter;
    constructor(locale?: string, options?: NumberFormatOptions, pattern?: string) {
        super(locale, options, pattern);
        this.numberFormat = NSNumberFormatter.new();
        if (locale) {
            this.numberFormat.locale = NSLocale.alloc().initWithLocaleIdentifier(locale);
        }
        if (options && options.style) {
            switch (options.style.toLowerCase()) {
                case "decimal":
                    this.numberFormat.numberStyle = NSNumberFormatterStyle.DecimalStyle;
                    break;
                case "percent":
                    this.numberFormat.numberStyle = NSNumberFormatterStyle.PercentStyle;
                    break;
                case "currency":
                    this.numberFormat.numberStyle = NSNumberFormatterStyle.CurrencyStyle;
                    if (options.currency !== void 0) {
                        this.numberFormat.currencyCode = options.currency;
                        if (options && options.currencyDisplay === "narrowSymbol") {
                            const currencySymbol = getSymbolFromCurrency(options.currency);
                            if (currencySymbol) this.numberFormat.currencySymbol = currencySymbol;
                        }
                    }
                    break;
                default:
                    this.numberFormat.numberStyle = NSNumberFormatterStyle.DecimalStyle;
                    break;
            }
        } else {
            this.numberFormat.numberStyle = NSNumberFormatterStyle.DecimalStyle;
        }

        if (options && options.minimumIntegerDigits !== void 0) {
            this.numberFormat.minimumIntegerDigits = options.minimumIntegerDigits;
        }

        if (options && options.minimumFractionDigits !== void 0) {
            this.numberFormat.minimumFractionDigits = options.minimumFractionDigits;
        }

        if (options && options.maximumFractionDigits !== void 0) {
            this.numberFormat.maximumFractionDigits = options.maximumFractionDigits;
        }

        if (options && options.useGrouping !== void 0) {
            this.numberFormat.usesGroupingSeparator = options.useGrouping;
        }

        if (pattern) {
            this.numberFormat.positiveFormat = pattern;
        } else {
            if (options && options.style && options.style.toLowerCase() === "currency" && options.currencyDisplay === "code") {
                let tempPattern = this.numberFormat.positiveFormat;
                // this will display currency code instead of currency symbol
                tempPattern = tempPattern.replace("¤", "¤¤");
                this.numberFormat.positiveFormat = tempPattern;
            }
        }
    }

    public formatNative(value: number) {
        return this.numberFormat.stringFromNumber(value);
    }
}

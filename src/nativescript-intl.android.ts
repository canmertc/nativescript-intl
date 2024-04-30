import { DateTimeFormat as commonDateTimeFormat, NumberFormat as commonNumberFormat, FULL } from "./nativescript-intl-common";
import { NumberFormatOptions } from "./nativescript-intl";
import getSymbolFromCurrency from "currency-symbol-map";

let localesCache: Map<string, any> = new Map<string, any>();

function getNativeLocale(locale?: string) {
    if (localesCache.has(locale)) {
        return localesCache.get(locale);
    }
    let result;
    if (locale) {
        locale = locale.replace(/_/g, "-");
        let firstHypenIndex = locale.indexOf("-");
        let lang = "";
        let country = "";
        if (firstHypenIndex > -1) {
            lang = locale.substr(0, firstHypenIndex);
            let nextHypenIndex = locale.substr(firstHypenIndex + 1).indexOf("-");
            country = locale.substr(firstHypenIndex + 1, nextHypenIndex > -1 ? nextHypenIndex : undefined);
        } else {
            lang = locale;
        }
        if (country !== "") {
            result = new java.util.Locale(lang, country);
        } else {
            result = new java.util.Locale(lang);
        }
    } else {
        result = new java.util.Locale("en", "US");
    }
    localesCache.set(locale, result);
    return result;
}

export class DateTimeFormat extends commonDateTimeFormat {
    public getNativePattern(
        patternDefinition: {
            date?: string;
            time?: string;
        },
        locale?: string
    ): string {
        let result = "";
        let flag = 0;
        let nativeLocale;
        if (locale) {
            nativeLocale = getNativeLocale(locale);
            flag++;
        }

        if (patternDefinition.date) {
            flag = flag + 2;
        }

        if (patternDefinition.time) {
            flag = flag + 4;
        }
        let dateFormat;
        switch (flag) {
            case 0:
                // no locale no date no time
                dateFormat = java.text.DateFormat.getDateTimeInstance();
                break;
            case 1:
                // only locale
                dateFormat = java.text.DateFormat.getDateTimeInstance(0, 0, nativeLocale);
                break;
            case 2:
                // only date 0 for full, 3 for Short date format using default locale
                dateFormat = java.text.DateFormat.getDateInstance(patternDefinition.date === FULL ? 0 : 3);
                break;
            case 3:
                // date + locale
                dateFormat = java.text.DateFormat.getDateInstance(patternDefinition.date === FULL ? 0 : 3, nativeLocale);
                break;
            case 4:
                // only time we always use long pattern using default locale
                dateFormat = java.text.DateFormat.getTimeInstance(1);
                break;
            case 5:
                // time + locale
                dateFormat = java.text.DateFormat.getTimeInstance(1, nativeLocale);
                break;
            case 6:
                // time + date using default locale
                dateFormat = java.text.DateFormat.getDateTimeInstance(patternDefinition.date === FULL ? 0 : 3, 1);
                break;
            case 7:
                // locale + date + time
                dateFormat = java.text.DateFormat.getDateTimeInstance(patternDefinition.date === FULL ? 0 : 3, 1, nativeLocale);
                break;
            default:
                break;
        }
        result = dateFormat.toPattern();
        return result;
    }

    public formatNative(pattern: string, locale?: string, date?: Date): string {
        let sdf = locale ? new java.text.SimpleDateFormat(pattern, getNativeLocale(locale)) : new java.text.SimpleDateFormat(pattern);
        return sdf.format(date ? new java.util.Date(date.valueOf()) : new java.util.Date()).toString();
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
    public numberFormat: java.text.DecimalFormat | java.text.NumberFormat | any;
    constructor(locale?: string, options?: NumberFormatOptions, pattern?: string) {
        super(locale, options, pattern);
        if (pattern) {
            this.numberFormat = new java.text.DecimalFormat(pattern);
        } else {
            if (options?.style) {
                switch (options.style.toLowerCase()) {
                    case "decimal":
                        this.numberFormat = java.text.NumberFormat.getNumberInstance(getNativeLocale(locale));
                        break;
                    case "percent":
                        this.numberFormat = java.text.NumberFormat.getPercentInstance(getNativeLocale(locale));
                        break;
                    case "currency":
                        this.numberFormat = java.text.NumberFormat.getCurrencyInstance(getNativeLocale(locale));
                        if (options.currency !== void 0) {
                            this.numberFormat.setCurrency(java.util.Currency.getInstance(options.currency));
                        }
                        break;
                    default:
                        this.numberFormat = java.text.NumberFormat.getNumberInstance(getNativeLocale(locale));
                        break;
                }
            } else {
                this.numberFormat = java.text.NumberFormat.getNumberInstance(getNativeLocale(locale));
            }
        }

        if (options && options.minimumIntegerDigits !== void 0) {
            this.numberFormat.setMinimumIntegerDigits(options.minimumIntegerDigits);
        }

        if (options && options.minimumFractionDigits !== void 0) {
            this.numberFormat.setMinimumFractionDigits(options.minimumFractionDigits);
        }

        if (options && options.maximumFractionDigits !== void 0) {
            this.numberFormat.setMaximumFractionDigits(options.maximumFractionDigits);
        }

        if (options && options.useGrouping !== void 0) {
            this.numberFormat.setGroupingUsed(options.useGrouping);
        }

        let decimalFormatSymbols = locale
            ? new java.text.DecimalFormatSymbols(getNativeLocale(locale))
            : new java.text.DecimalFormatSymbols();

        if (options?.currency !== void 0) {
            decimalFormatSymbols.setCurrency(java.util.Currency.getInstance(options.currency));
            // Use a narrow format symbol ("$100" rather than "US$100") (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#narrowsymbol)
            if (options && options.currencyDisplay === "narrowSymbol") {
                const currencySymbol = getSymbolFromCurrency(options.currency);
                if (currencySymbol) decimalFormatSymbols.setCurrencySymbol(currencySymbol);
            }
        }

        this.numberFormat.setDecimalFormatSymbols(decimalFormatSymbols);

        if (options?.style?.toLowerCase() === "currency" && options.currencyDisplay === "code") {
            if (!pattern) {
                let currrentPattern = this.numberFormat.toPattern();
                // this will display currency code instead of currency symbol
                currrentPattern = currrentPattern.replace("¤", "¤¤");
                this.numberFormat = new java.text.DecimalFormat(currrentPattern);
                this.numberFormat.setDecimalFormatSymbols(decimalFormatSymbols);
            }
        }
    }

    public formatNative(value: number) {
        const formattedValue = this.numberFormat.format(value);

        // WORKAROUND: 'format' method used to return incorrect grouping separator for 'en-BE'
        // on some Android devices (mostly API level 34) (e.g. €1,234,567,89 instead of €1.234.567,89).
        const dfs = this.numberFormat.getDecimalFormatSymbols();
        let groupingSeparator = dfs.getGroupingSeparator();
        if (![".", ","].includes(groupingSeparator)) groupingSeparator = String.fromCharCode(160);

        const groupingSize = this.numberFormat.getGroupingSize();

        if (this.numberFormat.isGroupingUsed() && value >= Math.pow(10, groupingSize) && !formattedValue.includes(groupingSeparator)) {
            const currentPattern = this.numberFormat.toPattern();
            const hasDecimalSeparator = currentPattern.includes(".");
            const hasFractionalPart = !!(value - Math.floor(value));
            const isCurrencyInstance = currentPattern.includes("¤");
            const decimalSeparator = isCurrencyInstance ? dfs.getMonetaryDecimalSeparator() : dfs.getDecimalSeparator();

            const currencySuffixOffset = currentPattern.length - (currentPattern.lastIndexOf("#") + 1);

            const decimalSeparatorIndex =
                hasDecimalSeparator && hasFractionalPart ? formattedValue.lastIndexOf(decimalSeparator) : undefined;
            const integerPart =
                hasDecimalSeparator && hasFractionalPart
                    ? formattedValue.substring(0, decimalSeparatorIndex)
                    : formattedValue.substring(0, formattedValue.length - currencySuffixOffset);
            const incorrectGroupingSeparator = integerPart[integerPart.length - groupingSize - 1];
            const integerPartCorrected = integerPart.replaceAll(incorrectGroupingSeparator, groupingSeparator);

            return (
                integerPartCorrected +
                (decimalSeparatorIndex ? formattedValue.substring(decimalSeparatorIndex) : "") +
                (currencySuffixOffset ? formattedValue.substring(formattedValue.length - currencySuffixOffset) : "")
            ); // Corrected formatted value
        } else {
            return formattedValue;
        }
    }
}

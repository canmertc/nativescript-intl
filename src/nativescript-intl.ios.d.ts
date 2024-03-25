import common = require("./nativescript-intl-common");
export declare class DateTimeFormat extends common.DateTimeFormat {
    getNativePattern(
        patternDefinition: {
            date?: string;
            time?: string;
        },
        locale?: string
    ): string;
    formatNative(pattern: string, locale?: string, date?: Date): string;
}
export declare class NumberFormat extends common.NumberFormat {
    constructor(locale?: string, options?: Intl.NumberFormatOptions, pattern?: string);
    formatNative(value: number): string;
}

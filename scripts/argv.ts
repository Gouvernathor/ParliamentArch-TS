import { argv } from "node:process";

/**
 * Returns the values that were passed before the first named argument.
 */
export function getAnonymousArgvValues(): string[] {
    const values = [];
    for (const i in argv) {
        if (i.startsWith("-")) {
            break;
        }
        values.push(i);
    }
    return values;
}

/**
 * Returns whether the argument was passed in the command line or not.
 * Does not accept an equal sign after the argument.
 */
export function getBooleanArgvValue(long: string, short?: string): boolean {
    const regex = short ? `^-(?:${short}|-${long})$` : `^--${long}$`;
    return argv.some(arg => RegExp(regex).test(arg));
}
/**
 * Returns the value of the argument passed in the command line.
 * The value is directly after the argument, separated either by an equal sign or a space (but not both).
 * If no value is found after the argument, the value is the empty string.
 * If the argument is not present, the value is undefined.
 */
export function getArgvValue(long: string, short?: string): string | undefined {
    const regexBegin = short ? `^-(?:${short}|-${long})` : `^--${long}`;
    const equalRegex = RegExp(`${regexBegin}=(.*)$`, "g");
    const nextRegex = RegExp(`${regexBegin}$`, "g");
    for (const i in argv) {
        const arg = argv[i]!;
        const [, value] = equalRegex.exec(arg) || [, undefined];
        if (value !== undefined) {
            return value;
        }

        if (nextRegex.test(arg)) {
            const nextArg = argv[+i + 1];
            if (nextArg) {
                return nextArg;
            } else {
                return "";
            }
        }
    }
    return undefined;
}
/**
 * If the argument is not present, returns undefined.
 * If the argument is present, returns an array of values
 * that were passed after it (space separated), the first being optionally separated by an equal sign,
 * until the next argument that starts with a dash (or the end of the arguments).
 */
export function getArgvValues(long: string, short?: string): string[]|undefined {
    const regexBegin = short ? `^-(?:${short}|-${long})` : `^--${long}`;
    const equalRegex = RegExp(`${regexBegin}=(.*)$`, "g");
    const nextRegex = RegExp(`${regexBegin}$`, "g");
    let values: string[]|undefined = undefined;
    for (const i in argv) {
        const arg = argv[i]!;
        if (values === undefined) {
            const [, value] = equalRegex.exec(arg) || [, undefined];
            if (value !== undefined) {
                values = [value];
            } else if (nextRegex.test(arg)) {
                values = [];
            }
        } else {
            if (arg.startsWith("-")) {
                break;
            } else {
                values.push(arg);
            }
        }
    }
    return values;
}

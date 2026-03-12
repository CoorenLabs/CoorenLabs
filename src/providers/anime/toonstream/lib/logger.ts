//! AI GENERATED 💀
export class Logger {
    private static readonly colors = {
        reset: "\x1b[0m",
        info: "\x1b[36m",
        success: "\x1b[32m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
        debug: "\x1b[90m",
    };

    private static formatMessage(level: string, color: string, message: string): string {
        const time = new Date().toLocaleTimeString();
        return `${this.colors.debug}[${time}]${this.colors.reset} ${color}[${level}]${this.colors.reset} ${message}`;
    }

    public static info(message: string, ...args: any[]) {
        console.log(this.formatMessage("INFO", this.colors.info, message), ...args);
    }

    public static success(message: string, ...args: any[]) {
        console.log(this.formatMessage("SUCCESS", this.colors.success, message), ...args);
    }

    public static warn(message: string, ...args: any[]) {
        console.warn(this.formatMessage("WARN", this.colors.warn, message), ...args);
    }

    public static error(message: string, ...args: any[]) {
        console.error(this.formatMessage("ERROR", this.colors.error, message), ...args);
    }

    public static debug(message: string, ...args: any[]) {
        console.debug(this.formatMessage("DEBUG", this.colors.debug, message), ...args);
    }
}
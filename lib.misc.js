/** Library of general functions and useful classes */

/** Logger Singleton class */
export class Logger {

    /**
     * Constructor
     * @param {NS} ns 
     * @param {number} logLevel level of log 0-7 {@link https://en.wikipedia.org/wiki/Syslog}
     */
    constructor(ns, logLevel) {
        this.ns = ns;
        this.logLevel = logLevel;
    }

    emerg(message) {
        this.ns.print(message);
        this.ns.tprint(message);
    }

    alert(message) {
        if (this.logLevel <= 1 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    crit(message) {
        if (this.logLevel <= 2 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    err(message) {
        if (this.logLevel <= 3 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    warning(message) {
        if (this.logLevel <= 4 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    notice(message) {
        if (this.logLevel <= 5 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    info(message) {
        if (this.logLevel <= 6 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    debug(message) {
        if (this.logLevel <= 7 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }
}
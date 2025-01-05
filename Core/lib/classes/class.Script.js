/**
 * Represents a running script and provides information about its status.
 */
export class Script {
    /**
     * Creates an instance of the Script class.
     * @param {Object} ns - The Netscript object used to interact with the game.
     * @param {number} pid - The Process ID of the script.
     */
    constructor(ns, pid) {
        /** @type {Object} */
        this.ns = ns;

        /** @type {number} */
        this.pid = pid;

        /** @type {number} */
        this.threads = this.ns.getRunningScript(this.pid).threads;
    }

    /**
     * Checks if the script is currently active (running).
     * @returns {boolean} True if the script is active, false otherwise.
     */
    get isActive() {
        let result = this.ns.getRunningScript(this.pid);
        if (result) {result = true} else {result = false}
        return result;
    }
}
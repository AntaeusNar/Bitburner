import { calculateSingleBatchThreads, calculateGrowTime, calculateWeakenTime, calculateHackingTime, getRoot } from "../lib/library";
import { base_delay } from "../lib/options";

export class MyServer {

    /**
     * Represents a server object with related properties such as max money, security level, and hacking requirements.
     *
     * @param {object} ns - The Netscript (API) object that provides methods for interacting with the game.
     * @param {string} hostname - The hostname of the server.
     * @param {number} [ramNeeded=1.75] - The amount of RAM needed for tasks on the server. Default is 1.75.
     */
    constructor(ns, hostname, ramNeeded = 1.75) {
        /**
         * @type {object} ns - The Netscript (API) object.
         */
        this.ns = ns;

        /**
         * @type {string} hostname - The server's hostname.
         */
        this.hostname = hostname;

        /**
         * @type {number} ramNeeded - The amount of RAM required for the server tasks.
         */
        this.ramNeeded = ramNeeded;

        /**
         * @type {number} moneyMax - The maximum amount of money the server can have.
         */
        this.moneyMax = ns.getServerMaxMoney(hostname);

        /**
         * @type {number} securityMin - The minimum security level required to hack the server.
         */
        this.securityMin = ns.getServerMinSecurityLevel(hostname);

        /**
         * @type {number} growthMultiplier - The server's growth multiplier, which affects how quickly the server grows.
         */
        this.growthMultiplier = ns.getServerGrowth(hostname);

        /**
         * @type {number} hackRequired - The required hacking level to hack the server.
         */
        this.hackRequired = ns.getServerRequiredHackingLevel(hostname);

        /**
         * @type {boolean} willBePrimed - Flag indicating if the server will be primed for hacking.
         */
        this.willBePrimed = false;

        /**
         * @type {number} batchScale - Scaling factor for batch operations (used for optimization).
         */
        this.batchScale = 1;
    }

    /**
     * Gets the max ram per server with special handling for home
     * @returns {number} ramMax
     */
    get ramMax() {
        if (this.hostname == 'home') {
            return this.ns.getServerMaxRam(this.hostname) - 32;
        }
        return this.ns.getServerMaxRam(this.hostname);
    }

    /**
     * Gets the root access status of the server.
     *
     * @returns {boolean} Returns true if the server has root access.
     */
    get root() {
        return getRoot(this.ns, this.hostname);
    }

    /**
     * Gets the hackable status of the server.
     *
     * @returns {boolean} Returns true if the server can be hacked.
     */
    get isHackable() {
        if (this.hackRequired > this.ns.getHackingLevel()) {
            return false;
        }
        return true;
    }

    /**
     * Gets the amount of RAM currently used by the server.
     *
     * @returns {number} The amount of RAM used on the server.
     */
    get ramUsed() {
        return this.ns.getServerUsedRam(this.hostname);
    }

    /**
     * Gets the available RAM on the server (max RAM - used RAM).
     *
     * @returns {number} The available RAM on the server if the server is rooted.
     */
    get ramAvailable() {
        if (!this.root) {
            return 0;
        }
        return this.ramMax - this.ramUsed;
    }

    /**
     * Gets the current security level of the server.
     *
     * @returns {number} The current security level of the server.
     */
    get securityCurrent() {
        return this.ns.getServerSecurityLevel(this.hostname);
    }

    /**
     * Gets the available money on the server.
     *
     * @returns {number} The amount of money available on the server.
     */
    get moneyAvailable() {
        if (!this.isHackable) {
            return 0;
        }
        return this.ns.getServerMoneyAvailable(this.hostname);
    }

    /**
     * Gets the time it takes to grow the server's money.
     *
     * @returns {number} The time required for the grow operation.
     * @see {NS.getGrowTime}
     */
    get growTime() {
        return this.ns.getGrowTime(this.hostname);
    }

    /**
     * Gets the time it takes to hack the server.
     *
     * @returns {number} The time required for the hack operation.
     * @see {NS.getHackTime}
     */
    get hackTime() {
        return this.ns.getHackTime(this.hostname);
    }

    /**
     * Gets the time it takes to weaken the server's security.
     *
     * @returns {number} The time required for the weaken operation.
     * @see {NS.getWeakenTime}
     */
    get weakenTime() {
        return this.ns.getWeakenTime(this.hostname);
    }

    /**
     * Gets the list of processes running on the server.
     *
     * @returns {Array<Object>} List of processes running on the server.
     * @see {NS.ps}
     */
    get ps() {
        return this.ns.ps(this.hostname);
    }

    /**
     * Gets the list of files on the server.
     *
     * @returns {Array<string>} List of file paths on the server.
     * @see {NS.ls}
     */
    get ls() {
        return this.ns.ls(this.hostname);
    }

    /**
     * Calculates the number of threads required for a batch operation to reach a specified target amount of money.
     *
     * @param {number} [targetTake=1] - The percentage of the server's maximum money to target for the hack. Default is 1 (100%).
     * @returns {Object|null} An Object of threads required for the batch operation as G,Wg,H,Wh, or `null` if unable to calculate.
     * @see {@link calculateSingleBatchThreads}
     */
    calcBatchThreads(targetTake = 1) {
        let threads = null;

        // If the player’s hacking level is too low, return null
        if (this.hackRequired > this.ns.getHackingLevel()) return threads;

        // If the server has no money, return null
        if (this.moneyMax == 0) return threads;

        // Adjust targetTake to represent percentage
        targetTake = targetTake * 100;

        // Calculate the target amount of money based on the targetTake percentage
        let targetMoney = this.moneyMax * targetTake;

        // Use the external function `calculateSingleBatchThreads` to calculate the number of threads needed
        threads = calculateSingleBatchThreads(
            this.hackRequired,
            this.securityMin,
            this.ns.getHackingLevel(),
            this.ns.getHackingMultipliers().chance,
            this.ns.getHackingMultipliers().money,
            this.growthMultiplier,
            this.ns.getHackingMultipliers().growth,
            targetMoney,
            0,
            targetTake
        );

        return threads;
    }

    /**
     * Gets the longest time of a script + delay in batch
     * @returns {number} time in sec
     */
    get batchMaxTime() {
        let maxTime = -Infinity;
        if (this.hackRequired > this.ns.getHackingLevel()) return 0;
        if (this.moneyMax == 0 ) return 0;
        let hackingLevel = this.ns.getHackingLevel();
        let hackingSpeed = this.ns.getHackingMultipliers().speed;
        let growTime = calculateGrowTime(this.hackRequired, this.securityMin, hackingLevel, hackingSpeed);
        let hackTime = calculateHackingTime(this.hackRequired, this.securityMin, hackingLevel, hackingSpeed);
        let weakenTime = calculateWeakenTime(this.hackRequired, this.securityMin, hackingLevel, hackingSpeed);
        let timing = {
            G: growTime,
            Wg: weakenTime + base_delay,
            H: hackTime + base_delay * 2,
            Wh: weakenTime + base_delay * 3
        }
        for (const key of Object.keys(timing)) {
            if (timing[key] > maxTime) {
                maxTime = timing[key];
            }
        }
        return maxTime;
    }

    /**
     * Gets the time for the cycle operation, which is the same as the maximum batch time.
     *
     * @returns {number} The maximum cycle time for the operation.
     * @alias batchMaxTime
     */
    get cycleTime() {
        return this.batchMaxTime;
    }

    /**
     * Get the max number of batches that can be run per cycle
     * @returns {number} Maximum number of batches that can be run per cycle
     */
    get cycleBatches() {
        return Math.ceil(this.cycleTime/(base_delay*4));
    }

    /**
     * Gets the number of concurrent threads during one batch
     * One batch is a complete GWgHWh deployment.  Each group of threads are delayed so the target is hit with G + delay + Wg etc.
     * Cycle threads are counted from the start of the first G to the end of the first Wh + delay.
     * This should then be the MAX number of threads that CAN target a single server in ideal conditions. (After the initial Weakens)
     * @returns {number} Cycle threads
     */
    get cycleThreads() {
        let threads = this.calcBatchThreads();
        if (threads == null) return 0;
        let threadCount = Object.values(threads).reduce((a,c) => a + c);

        return Math.round(this.cycleBatches * threadCount);
    }

    /**
     * Gets the minimum Scripts per cycle
     * @returns {number} Min Scripts per cycle
     */
    get cycleScripts() {
        return this.cycleBatches*4;
    }

    /**
     * Gets the priority as $/Sec/Thread
     * @returns {number} $/Sec/Thread
     */
    get priority() {
        let _priority = (this.moneyMax * this.cycleBatches) / this.cycleTime / this.cycleThreads;
        if (isNaN(_priority)) _priority = 0;
        return _priority;
    }


}
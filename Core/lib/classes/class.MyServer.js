import { calcHackChance, calcPercentMoneyHacked, calculateSingleBatchThreads, calculateSingleBatchTiming, getRoot } from "../lib/library.js";
import { base_delay } from "../lib/options.js";

/**
 * Represents a server in Bitburner.
 *
 * This class is used to create actual objects that represent servers, providing useful
 * methods and properties for interacting with the server in a more manageable way.
 * It generates both the NS version and the getServer version, which do not seem to match
 * but are unified through this class.
 *
 * @class MyServer
 */
export class MyServer {

    /**
     * Creates a MyServer instance from a given hostname.
     *
     * @param {NS} ns - The Bitburner NS object used for NS interaction.
     * @param {string} hostname - The hostname of the server to represent.
     * @param {number} [neededRam=1.75] - The amount of RAM required for operations on the server (default is 1.75).
     */
    constructor(ns, hostname, neededRam=1.75) {
        /** @type {string} */
        this.hostname = hostname;

        /** @type {number} Max Ram per Thread*/
        this.ramNeeded = neededRam;

        /** @type {number} */
        this.moneyMax = ns.getServerMaxMoney(hostname);

        /** @type {number} */
        this.securityMin = ns.getServerMinSecurityLevel(hostname);

        /** @type {number} */
        this.growthMultiplier = ns.getServerGrowth(hostname);

        /** @type {number} */
        this.hackRequired = ns.getServerRequiredHackingLevel(hostname);

        /** @type {NS} */
        this.ns = ns;
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
     * Checks if the server's security is at its minimum (primed for hacking).
     *
     * @returns {boolean} True if the server's security is at its minimum level.
     */
    get securityIsPrimed() {
        return this.securityCurrent === this.securityMin;
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
     * Checks if the server's money is at its maximum (primed for hacking).
     *
     * @returns {boolean} True if the server's money is at its maximum.
     */
    get moneyIsPrimed() {
        return this.moneyAvailable === this.moneyMax;
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
     * Gets the threads needed for a single batch vs server at ideal conditions
     * @returns {object|null} Object containing threads as GWgHWh or null
     */
    get batchThreads() {
        let threads = null;
        if (this.hackRequired > this.ns.getHackingLevel()) return threads;
        if (this.moneyMax == 0) return threads;
        threads = calculateSingleBatchThreads(
            this.hackRequired,
            this.securityMin,
            this.ns.getHackingLevel(),
            this.ns.getHackingMultipliers().chance,
            this.ns.getHackingMultipliers().money,
            this.growthMultiplier,
            this.ns.getHackingMultipliers().growth,
            this.moneyMax,
            0,
            100
        )
        return threads;
    }

    /**
     * Get the timing of a single batch of threads
     * @returns {object|null} Object with timing as GWgHWh
     */
    get batchTiming() {
        let threadTiming = null;
        if (this.hackRequired > this.ns.getHackingLevel()) return threadTiming;
        if (this.moneyMax == 0) return threadTiming;
        threadTiming = calculateSingleBatchTiming(this.hackRequired, this.securityMin, this.ns.getHackingLevel(), this.ns.getHackingMultipliers().speed);
        return threadTiming;
    }

    /**
     * Get the max number of batches that can be run per cycle
     * @returns {number} Maximum number of batches that can be run per cycle
     */
    get batchesPerCycle() {
        let timings = this.batchTiming;
        if (timings == null) return 0;

        let maxTime = -Infinity;
        for (const key of Object.keys(timings)) {
            if (timings[key] > maxTime) {
                maxTime = timings[key];
            }
        }
        return Math.round(maxTime/(base_delay*4));
    }

    /**
     * Gets the number of concurrent threads during one batch
     * One batch is a complete GWgHWh deployment.  Each group of threads are delayed so the target is hit with G + delay + Wg etc.
     * Cycle threads are counted from the start of the first G to the end of the first Wh + delay.
     * This should then be the MAX number of threads that CAN target a single server in ideal conditions. (After the initial Weakens)
     * @returns {number} Cycle threads
     */
    get cycleMaxThreads() {
        let threads = this.batchThreads;
        if (threads == null) return 0;
        let threadCount = Object.values(threads).reduce((a,c) => a + c);

        return Math.round(this.batchesPerCycle * threadCount);
    }

    /**
     * Gets the minimum Scripts per cycle
     * @returns {number} Min Scripts per cycle
     */
    get scriptsPerCycle() {
        return this.batchesPerCycle*4;
    }

    /**
     * Gets the priority as $/Sec/Thread
     * @returns {number} $/Sec/Thread
     */
    get priority() {
        if (this.hackRequired > this.ns.getHackingLevel()) return 0;
        if (this.moneyMax == 0) return 0;
        let chance = calcHackChance(this.hackRequired, this.securityMin, this.ns.getHackingLevel(), this.ns.getHackingMultipliers().chance);
        let percent = calcPercentMoneyHacked(this.hackRequired, this.securityMin, this.ns.getHackingLevel(), this.ns.getHackingMultipliers().money);
        let timings = this.batchTiming;
        let maxTime = -Infinity;
        for (const key of Object.keys(timings)) {
            if (timings[key] > maxTime) {
                maxTime = timings[key];
            }
        }

        let threadCount = Object.values(this.batchThreads).reduce((a,c) => a + c);

        let _priority = (chance * percent * this.moneyMax) / maxTime / threadCount;
        if (isNaN(_priority)) _priority = 0;
        //this.ns.tprint(this.hostname + " Money: " + (chance * percent * this.moneyMax) + " MaxTime: " + maxTime + " ThreadCount: " + threadCount + " Priority: " + _priority);
        return _priority;
    }

}
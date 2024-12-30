import { getRoot } from "../../lib";

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

        /** @type {number} */
        this.ramMax = ns.getServerMaxRam(hostname);

        /** @type {number} */
        this.ramNeeded = neededRam;

        /** @type {number} */
        this.moneyMax = ns.getServerMaxMoney(hostname);

        /** @type {number} */
        this.securityMin = ns.getServerMinSecurityLevel(hostname);

        /** @type {number} */
        this.growthMultiplier = ns.getServerGrowth(hostname);

        /** @type {number} */
        this.hackRequired = ns.getServerRequiredHackingLevel(hostname);

        /** @type {number} */
        this.portRequired = ns.getServerNumPortsRequired(hostname);

        /** @type {NS} */
        this.ns = ns;
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
     * @returns {number} The available RAM on the server.
     */
    get ramAvailable() {
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
     * Gets the maximum number of threads that can be run based on available RAM and required RAM.
     *
     * @returns {number} The maximum number of threads that can be run.
     */
    get maxNumThreads() {
        return Math.floor(this.ramMax / this.ramNeeded + 0.5);
    }
}
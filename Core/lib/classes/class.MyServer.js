import { getRoot } from "../../lib";

/** the MyServer class 
 * getServer in Bitburner does not return the actual object, and since it is a TypeScript interface
 * modifying the base object is also ...not possible? or at least I don't know how to 20241229
 *
 * this class then is what we are using to create actual objects that we can do more with
 * generate both the ns version and the getServer version - not sure why they don't match but they don't
*/
/**
 * note about the naming: everything should be unified as
 * itemStatus - ei ramMax, ramUsed, ramAvailable
 */
export class MyServer {

    /** Creates a MyServer from hostname
     * @param {NS} ns
     * @param {string} hostname
     * @param {number} [neededRam=1.75]
     */
    constructor(ns, hostname, neededRam=1.75) {
        this.hostname = hostname;
        this.ramMax = ns.getServerMaxRam(hostname);
        this.ramNeeded = neededRam;
        this.moneyMax = ns.getServerMaxMoney(hostname);
        this.securityMin = ns.getServerMinSecurityLevel(hostname);
        this.growthMultiplier = ns.getServerGrowth(hostname);
        this.hackRequired = ns.getServerRequiredHackingLevel(hostname);
        this.portRequired = ns.getServerNumPortsRequired(hostname);

        this.ns = ns;
    }

    get root() {
        return getRoot(this.ns, this.hostname);
    }

    get ramUsed() {
        return this.ns.getServerUsedRam(this.hostname);
    }

    get ramAvailable() {
        return this.maxRam - this.usedRam;
    }

    get securityCurrent() {
        return this.ns.getServerSecurityLevel(this.hostname);
    }

    get securityIsPrimed() {
        if (this.securityCurrent == this.securityMin) {
            return true;
        }
        return false;
    }

    get moneyAvailable() {
        return this.ns.getServerMoneyAvailable(this.hostname);
    }

    get moneyIsPrimed() {
        if (this.moneyAvailable == this.moneyMax) {
            return true;
        }
        return false;
    }

    // ns doc only
    get growTime() {
        return this.ns.getGrowTime(this.hostname);
    }

    // ns doc only
    get hackTime() {
        return this.ns.getHackTime(this.hostname);
    }

    // ns doc only
    get weakenTime() {
        return this.ns.getWeakenTime(this.hostname);
    }

    // ns doc only
    get ps() {
        return this.ns.ps(this.hostname);
    }

    // ns doc only
    get ls() {
        return this.ns.ls(hostname);
    }

    get maxNumThreads() {
        return Math.floor(this.ramMax/this.neededRam + .5);
    }



}
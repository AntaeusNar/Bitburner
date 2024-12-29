import { getRoot } from "../../lib";

/** the MyServer class 
 * getServer in Bitburner does not return the actual object, and since it is a TypeScript interface
 * modifying the base object is also ...not possible? or at least I don't know how to 20241229
 *
 * this class then is what we are using to create actual objects that we can do more with
 * generate both the ns version and the getServer version - not sure why they don't match but they don't
*/
export class MyServer {

    /** Creates a MyServer from hostname
     * @param {NS} ns
     * @param {string} hostname
     */
    constructor(ns, hostname, neededRam=1.75) {
        //Shared between both the ns documentation AND the getServer interface
        this.hostname = hostname;
        this.maxRam = ns.getServerMaxRam(hostname);
        this.ramMax = this.maxRam;

        //ns documentation version
        this.minSecurity = ns.getServerMinSecurityLevel(hostname);
        this.growth = ns.getServerGrowth(hostname);
        this.requiredHackingLevel = ns.getServerRequiredHackingLevel(hostname);
        this.numPortsRequired = ns.getServerNumPortsRequired(hostname);
        this.maxMoney = ns.getServerMaxMoney(hostname);

        //getServer interface documentation alias
        this.minDifficulty = this.minSecurity;
        this.serverGrowth = this.growth;
        this.requiredHackingSkill = this.requiredHackingLevel;
        this.numOpenPortsRequired = this.numPortsRequired;
        this.moneyMax = this.maxMoney;

        this.neededRam = neededRam;

        this.ns = ns;
    }

    // getServer then ns doc (nuke)
    get hasAdminRights() {
        return getRoot(this.ns, this.hostname);
    }
    get hasRootAccess() {
        return getRoot(this.ns, this.hostname);
    }
    get nuke() {
        return getRoot(this.ns, this.hostname);
    }

    // getServer then ns doc (ram being used)
    get ramUsed() {
        return this.ns.getServerUsedRam(this.hostname);
    }
    get usedRam() {
        return this.ramUsed;
    }

    get ramAvailable() {
        return this.maxRam - this.usedRam;
    }

    // getServer then ns doc (current server security level)
    get hackDifficulty() {
        return this.ns.getServerSecurityLevel(this.hostname);
    }
    get securityLevel() {
        return this.hackDifficulty;
    }

    // getServer and ns (current money on server)
    get moneyAvailable() {
        return this.ns.getServerMoneyAvailable(this.hostname);
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

    get neededRam() {
        return this._neededRam;
    }
    set neededRam(neededRam) {
        this._neededRam = neededRam;
    }

    get maxNumThreads() {
        return Math.floor(this.ramMax/this.neededRam + .5);
    }

}
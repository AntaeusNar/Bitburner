import { getNeededRam, logger, multiScan, formatMoney } from "../lib/library";
import { max_scripts } from "../lib/options";
import { MyServer } from "./class.MyServer";
/**
 * Represents the hack controller ai.
 *
 * @class HackController
 */
export class HackController {

    /**
     * Creates a HackController instance
     *
     * @param {NS} ns
     */
    constructor(ns) {

        this.ns = ns;

        /** @type {string[]} Array of script files(WGH)*/
        this.batchFiles = ['./lib/lt-weaken.js', './lib/lt-grow.js', './lib/lt-hack.js'];

        /** @type {number} Needed Ram per Thread */
        this.ramNeeded = getNeededRam(ns, this.batchFiles);

        /** @type {string[]} array of all found hostnames */
        this.serverList = [];

        /** @type {number} count of visible servers */
        this.serverCount = 0;

        /** @type {MyServer[]}  Array of MyServers */
        this.serverInventory = [];

        /** @type {number} */
        this.scriptsUsable = max_scripts;

        /** @type {number} */
        this.threadsUsable = this.threadsMax;

        this.scanFromHome();
        this.generateInventory();
        this.sortServersByPriority();
        this.copyFiles();
    }

    scanFromHome() {
        this.serverList = multiScan(this.ns, 'home');
        this.serverCount = this.serverList.length;
        logger(this.ns, this.ns.sprintf('INFO: Found %d Servers on network.', this.serverCount));
    }

    generateInventory() {
        logger(this.ns, this.ns.tprint("Building Server Inventory."));
        this.serverList.forEach(element => {
            this.serverInventory.push(new MyServer(this.ns, element, this.ramNeeded))
        });
    }

    sortServersByPriority() {
        if (this.serverInventory.length == 0) return null;
        this.serverInventory = this.serverInventory.sort((a, b) => b.priority - a.priority);
    }

    get ramMax() {
        return this.serverInventory.reduce((n, {ramMax}) => n + ramMax, 0);
    }

    get threadsMax() {
        return Math.round(this.ramMax/this.ramNeeded);
    }

    printPriorities() {
        let maxThreads = this.threadsMax;

        let countedThreads = 0;
        let countedScripts = 0;
        let hitMaxThreads = false;
        let hitMaxScripts = false;

        for (const server of this.serverInventory) {
            if (countedThreads >= maxThreads && !hitMaxThreads) {
                logger(this.ns, this.ns.sprintf("INFO: %d of %d Threads limit hit.  No more Servers can be hacked.  %d scripts remaining.", countedThreads, maxThreads, max_scripts - countedScripts))
                hitMaxThreads = true;
            }
            if (countedScripts >= max_scripts && !hitMaxScripts) {
                logger(this.ns, "INFO: Max Scripts reached. No more Servers can be hacked.");
                hitMaxScripts = true;
            }
            if (hitMaxScripts || hitMaxThreads) {
               return;
            }
            logger(this.ns, this.ns.sprintf('Hostname: %s, Priority($/Sec/Thread): %s, Max Threads/Cycle: %d, Min Scripts/Cycle: %d.', server.hostname, formatMoney(server.priority), server.cycleMaxThreads, server.scriptsPerCycle));
            countedThreads += server.cycleMaxThreads;
            countedScripts += server.scriptsPerCycle;
        }
        logger(this.ns, this.ns.sprintf('INFO: Remaining Threads: %d, Remaining Scripts: %d', maxThreads - countedThreads, max_scripts - countedScripts));
    }

    copyFiles() {
        for (let server of this.serverInventory) {
            if (server.hostname != 'home' && server.root) {
                this.ns.scp(this.batchFiles, server.hostname, 'home');
            }
        }
    }

    printPrimeWeakens() {
        for (const server of this.serverInventory) {
            logger(this.ns, this.ns.sprintf("Hostname: %s, Primary Weaken threads: %d, Primary Weaken Time: %s.", server.hostname, server.weakenPrimaryThreads, new Date(server.weakenTime * 1000).toISOString().substring(11, 23)));
        }
    }
}
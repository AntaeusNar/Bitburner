import { getNeededRam, multiScan } from "../lib/library";
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

        /** @type {number} Maximum Ram Controller can use */
        this.ramMax = 0;

        /** @type {number} Maximum Threads Controller can use */
        this.threadsMax = 0;
    }

    scanFromHome() {
        this.serverList = multiScan(this.ns, 'home');
        this.serverCount = this.serverList.length;
    }

    generateInventory() {
        this.serverList.forEach(element => {
            this.serverInventory.push(new MyServer(ns, element, this.ramNeeded))
        });
    }

    sortServersByPriority() {
        if (this.serverInventory.length == 0) return null;
        this.serverInventory = this.serverInventory.sort((a, b) => b.priority - a.priority);
    }
}
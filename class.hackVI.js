/** The overall Hack Virtual Intelligence (VI) */

import { can, Logger, maxNeededRam, recServerScan } from "./lib.misc";
import { maxScripts } from "./options";

const logger = new Logger(ns, 7);
const date = new Date();
const checkInterval = 1000*60*60;

export class HackVI {
    constructor(ns) {
        this.ns = ns;
        this.nextUpdate = date.getTime + checkInterval;
        return this;
    }

    get files() {
        return ['lt-weaken.js', 'lt-grow.js', 'lt-hack.js'];
    }

    get neededRam() {
        if (!this._neededRam || this.updateCheck) {
            this._neededRam = maxNeededRam(this.ns, this.files);
        }
        return this._neededRam;
    }

    get serverList() {
        if (!this._serverList || this.updateCheck) {
            this._serverList = recServerScan(this.ns);
            let world = 'w0rld_d43m0n';
            if (this._serverList.includes(world) &&
            this.ns.getServerRequiredHackingLevel(world) <= this.ns.getHackingLevel()) {
                this.ns.exec('map.js');
                this.ns.exit();
            }
        }
         return this._serverList;
    }

    get serverArray() {
        if (!this._serverArray || this.updateCheck) {
            this._serverArray = [];
            for (let s in this.serverList) {
                if (!s.hasAdminRights) {
                    this.getRoot(s);
                }
                this._serverArray.push(this.ns.getServer(s));
            }
        }
        return this._serverArray;
    }

    get updateCheck() {
        if (date.getTime >= this.nextUpdate) {
            this.nextUpdate = date.getTime + checkInterval;
            return true;
        }
        return false;
    }

    getRoot(server) {
        if (server.hostname == 'home') {
            return;
        }
        if (server.numOpenPortsRequired > server.openPortCount) {
            if (can(this.ns, 'brutessh.exe')) { this.ns.brutessh(server.hostname)}
            if (can(this.ns, 'ftpcrack.exe')) { this.ns.ftpcrack(server.hostname)}
            if (can(this.ns, 'relaysmtp.exe')) { this.ns.relaysmtp(server.hostname)}
            if (can(this.ns, 'httpworm.exe')) { this.ns.httpworm(server.hostname)}
            if (can(this.ns, 'sqlinject.exe')) { this.ns.sqlinject(server.hostname)}
            if (server.numOpenPortsRequired > server.openPortCount) {
                return;
            }
        }
        this.ns.nuke(server.hostname);
        return;
    }

    run() {

        // Make sure we backdoor everything

        // See if we can run more scripts

        // confirm best target

        // deploy more scripts


    }


}
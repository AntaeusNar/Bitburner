/** The overall Hack Virtual Intelligence (VI) */

import { can, Logger, maxNeededRam, recServerScan } from "./lib.misc";
import { maxScripts } from "../../archive/options";

const logger = new Logger(ns, 7);
const date = new Date();
const checkInterval = 1000*60*60;

export class HackVI {
    constructor(ns) {
        this.ns = ns;
        this.nextUpdate = date.getTime + checkInterval;
        this.tracker = {
            cycle: 1,
            batch: 1
        }
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
                this.ns.scp(this.files, s.hostname, 'home');
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

    get currentScripts() {
        this._currentScripts = 0;
        for (let s in this.serverArray) {
            this._currentScripts += this.ns.ps(s.hostname).length
        }
        return this._currentScripts;
    }

    get availableRam() {
        let ramCount = 0;
        for (let s in this.serverArray) {
            ramCount += (s.maxRam - s.ramUsed);
        }
        return ramCount;
    }

    calcVectors(server, maxThreads = 10000) {
        const weakenRate = .05;
        const growRate = .004;
        const hackRate = .002;
        let vectors = {
            Weakens: 0,
            Grows: 0,
            wGrows: 0,
            Hacks: 0,
            wHacks: 0
        }

        // Check to see if we should weaken it first
        if (this.ns.getServerSecurityLevel(server.hostname) != server.minDifficulty) {
            vectors.Weakens = Math.min(maxThreads, Math.ceil((this.ns.getServerSecurityLevel(server.hostname)-server.minDifficulty)/weakenRate));
            maxThreads -= vectors.Weakens;
        }

        // Drop if out of Threads
        if (maxThreads < 4 ) {
            return vectors;
        }

        // Calc Grow + weaken after grows
        let growthMultiplier = 0;
        if (server.moneyMax == server.moneyAvailable) {
            growthMultiplier = server.moneyMax/(Math.max(1, (server.moneyMax * (1 - server.takePercent))))
        }

    }

    run() {

        // See if we can run more scripts
        if (maxScripts <= this.currentScripts) {
            return;
        }
        if (this.availableRam <= this.neededRam) {
            return;
        }

        // confirm best target

        // deploy more scripts


    }


}
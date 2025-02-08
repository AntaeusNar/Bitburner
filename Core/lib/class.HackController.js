import { MyServer } from "./class.MyServer";
import { getNeededRam, logger, multiScan } from "./lib.general";
import { maxScripts } from "./options.general";

export class HackController {
    constructor(ns) {
        this.ns = ns;
        this.inventory = {
            targets: [],
            drones: []
        }
        this.maxScripts = maxScripts;
        this.batchFiles = ['./lib/lt-weaken.js', './lib/lt-grow.js', './lib/lt-hack.js'];
        this.neededRam = getNeededRam(ns, this.batchFiles);
        this.knownHackable = 0;
        this.generateInventory();
        this.calculateTargetPercentage();
        this.sort();
        this.recheckTime = 0;
    }

    get getHackable() { return this.inventory.targets.filter((server, i) => { return server.isHackable; }).length; }
    get maxThreads() { return this.inventory.drones.reduce((acc, server) => acc + server.availableRam || 0, 0)}

    generateInventory() {
        let serverList = multiScan(this.ns);
        this.maxThreads = 0;
        for (let hostname of serverList) {
            let server = new MyServer(this.ns, hostname)
            let availableRam = isNaN(server.availableRam) ? 0 : server.availableRam;
            this.maxThreads += Math.floor(availableRam/this.neededRam);
            this.inventory.targets.push(server)
            this.inventory.drones.push(server)
        }
        this.knownHackable = this.getHackable;
        logger(this.ns, 'Found ' + serverList.length + ' servers, ' + this.inventory.targets.length + ' targets, ' + this.inventory.drones.length + ' drones.')
    }

    sort() {
        this.inventory.targets.sort((a, b) => b.priority - a.priority);
    }

    calculateTargetPercentage() {
        for (let server of this.inventory.targets) {
            server.calculateTargetPercentage(this.maxThreads);
        }
    }

    run() {
        let hackable = this.getHackable;
        if (this.knownHackable < hackable) {
            logger(this.ns, 'INFO: New Targets Available: ' + hackable + ' vs ' + this.knownHackable + '. Recalculating Priorities and Resorting Targets.');
            this.knownHackable = hackable;
            this.calculateTargetPercentage();
            this.sort();
        }

        let targets = this.inventory.targets.filter(server => server.isHackable);
        for (let i = 0; i < targets.length; i++) {
            let targetServer = targets[i];
            if (targetServer.recheckTime >= this.ns.getRunningScript().onlineTime) {
                let remainingThreads = this.maxThreads - targetServer.maxParallelThreads;
                if (remainingThreads <= targetServer.maxParallelThreads) { break; }
                continue;
            }
            let results = {};
            logger(this.ns, 'INFO: Targeting ' + targetServer.hostname + ' Priority: $' + targetServer.priority + ' isPrimed: ' + targetServer.isPrimed + '. Starting Cycle/Batch: ' + targetServer.cycleBatch, 0);
            results = targetServer.hackSelf(this.inventory.drones, this.batchFiles, this.maxScripts, this.maxThreads);
            switch(results.lastCompletedStage) {
                case '':
                    logger(this.ns, "WARNING: Priming vs " + targetServer.hostname + ' did not complete. Recheck in ' + results.recheckDelay + ' sec. Starting Cycle/Batch: ' + targetServer.cycleBatch);
                    break;
                case 'Priming':
                    logger(this.ns, 'INFO: Priming completed vs ' + targetServer.hostname + ' but batch did not complete. Recheck in ' + results.recheckDelay + ' sec.', 0);
                    break;
                case 'Batch':
                    logger(this.ns, 'INFO: Priming and Batch completed vs ' + targetServer.hostname + '. Recheck in ' + results.recheckDelay + ' sec.', 0);
                    break;
                default:
                    throw new Error("Results vs " + targetServer.hostname + ' return unexpected stage ' + results.lastCompletedStage);
            }
            targetServer.recheckTime = this.ns.getRunningScript().onlineRunningTime + results.recheckDelay;

            let remainingThreads = this.maxThreads - targetServer.maxParallelThreads;
            if (remainingThreads <= targetServer.maxParallelThreads) { break; }
        }
    }
}
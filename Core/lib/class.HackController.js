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
        this.maxThreads = 0;
        this.maxScripts = maxScripts;
        this.batchFiles = ['./lib/lt-weaken.js', './lib/lt-grow.js', './lib/lt-hack.js'];
        this.neededRam = getNeededRam(ns, this.batchFiles);
        this.knownHackable = 0;
        this.generateInventory();
        this.calculateTargetPercentage();
        this.sort();
    }

    get getHackable() { return this.inventory.targets.filter((server, i) => { return server.isHackable; }).length; }

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
        let targetServer = this.inventory.targets[0];
        logger(this.ns, 'INFO: Targeting ' + targetServer.hostname + ' Priority: $' + targetServer.priority + ' isPrimed: ' + targetServer.isPrimed);
        let results = targetServer.hackSelf(this.inventory.drones, this.batchFiles, this.maxScripts, this.maxThreads);
        logger(this.ns, "INFO: Results: " + JSON.stringify(results));
    }
}
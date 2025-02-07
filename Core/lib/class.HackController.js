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
        this.cycle = 1;
        this.batch = 1;
        this.generateInventory();
        this.calculateTargetPercentage();
        this.sort();
    }

    get cycleBatch() { return this.cycle + "/" + this.batch; }

    generateInventory() {
        let serverList = multiScan(this.ns);
        for (let hostname of serverList) {
            let server = new MyServer(this.ns, hostname)
            let availableRam = isNaN(server.availableRam) ? 0 : server.availableRam;
            this.maxThreads += Math.floor(availableRam/this.neededRam);
            this.inventory.targets.push(server)
            this.inventory.drones.push(server)
        }
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

    hackBest() {
        this.sort();
        let targetServer = this.inventory.targets[0];
        logger(this.ns, 'INFO: Targeting ' + targetServer.hostname + ' Priority: $' + targetServer.priority);
        let results = targetServer.hackSelf(this.inventory.drones, this.batchFiles, this.maxScripts, this.cycleBatch, this.maxThreads);
        logger(this.ns, "INFO: Results: " + JSON.stringify(results));
    }
}
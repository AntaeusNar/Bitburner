import { MyServer } from "./class.MyServer";
import { getNeededRam, multiScan } from "./lib.general";

export class HackController {
    constructor(ns) {
        this.ns = ns;
        this.inventory = {
            targets: [],
            drones: []
        }
        this.maxThreads = 0;
        this.batchFiles = ['./lib/lt-weaken.js', './lib/lt-grow.js', './lib/lt-hack.js'];
        this.neededRam = getNeededRam(ns, this.batchFiles);
        this.generateInventory();
        this.calculateTargetPercentage();
        this.sort();
    }

    generateInventory() {
        let serverList = multiScan(this.ns, 'home');
        for (let hostname of serverList) {
            let server = new MyServer(this.ns, hostname)
            let availableRam = isNaN(server.availableRam) ? 0 : server.availableRam;
            this.maxThreads += Math.floor(availableRam/this.neededRam);
            this.inventory.targets.push(server)
            this.inventory.drones.push(server)
        }
    }

    sort() {
        this.inventory.targets.sort((a, b) => b.priority - a.priority);
        this.inventory.drones.sort((a, b) => b.maxRam - a.maxRam);
    }

    calculateTargetPercentage() {
        for (let server of this.inventory.targets) {
            server.calculateTargetPercentage(this.maxThreads);
        }
    }
}
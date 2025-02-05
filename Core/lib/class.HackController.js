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
        this.batchFiles = ['./lt-weaken.js', './lt-grow.js', './lt-hack.js'];
        this.neededRam = getNeededRam(ns, this.batchFiles);
        this.generateInventory();
        this.sort();
        this.calculateTargetPercent();
    }

    generateInventory() {
        let serverList = multiScan(this.ns, 'home');
        for (let hostname of serverList) {
            let server = new MyServer(this.ns, hostname)
            this.maxThreads += server.maxRam/this.neededRam;
            this.inventory.targets.push(server)
            this.inventory.drones.push(server)
        }
    }

    sort() {
        this.inventory.targets.sort((a, b) => b.priority - a.priority);
        this.inventory.drones.sort((a, b) => b.maxRam - a.maxRam);
    }

    calculateTargetPercent() {
        let maxThreads = this.maxThreads;
        for (let server of this.inventory.targets) {
            if (maxThreads <= 0 ) { break; }
            server.calculateTargetPercent(maxThreads);
            maxThreads - server.batchThreads.IdealTotal;
        }
    }
}
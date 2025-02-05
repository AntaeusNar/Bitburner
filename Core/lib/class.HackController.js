import { MyServer } from "./class.MyServer";
import { multiscan } from "./lib.general";

export class HackController {
    constructor(ns) {
        this.ns = ns;
        this.inventory = {
            targets: [],
            drones: []
        }
        this.generateInventory();
    }

    generateInventory() {
        let serverList = multiscan(this.ns, 'home');
        for (let hostname of serverList) {
            let server = new MyServer(this.ns, hostname)
            this.inventory.targets.push(server)
            this.inventory.drones.push(server)
        }
    }

    sort() {
        this.inventory.targets.sort((a, b) => b.priority - a.priority);
        this.inventory.drones.sort((a, b) => b.maxRam - a.maxRam);
    }
}
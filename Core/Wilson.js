import { HackController } from "./lib/class.HackController";
import { logger } from "./lib/lib.general";

export function main(ns) {
    ns.disableLog('ALL');
    let hackingController = new HackController(ns);

    for (let server of hackingController.inventory.targets) {
        logger(ns, server.hostname + " Priority: $" + server.priority + ' as $/Sec/Thread. Threads per batch: ' + server.batchThreads.IdealTotal + ' Priming Threads needed: ' + server.batchThreads.PrimeTotal);
    }
}
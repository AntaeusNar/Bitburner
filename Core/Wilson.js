import { HackController } from "./lib/class.HackController";
import { logger } from "./lib/lib.general";

export async function main(ns) {
    ns.disableLog('ALL');
    //ns.enableLog('exec');
    let hackingController = new HackController(ns);

    logger(ns, 'Available Threads: ' + hackingController.maxThreads);
    /**
    for (let server of hackingController.inventory.targets) {
        logger(ns, server.hostname + " Priority: $" + server.priority + ' as $/Sec/Thread. Threads per batch: ' + server.batchThreads.IdealTotal + ' Priming Threads needed: ' + server.batchThreads.PrimeTotal + ' Take %: ' + server.percent);
    }
    /**
    hackingController.inventory.drones.sort((a, b) => b.availableRam - a.availableRam);
    for (let server of hackingController.inventory.drones) {
        logger(ns, server.hostname + ' has ' + server.availableRam + 'GB of ' + server.maxRam + 'GB available. Actual maxRam is ' + ns.getServerMaxRam(server.hostname) + 'GB.');
    }
    */

    while (true) {
        hackingController.run();
        await ns.sleep(500);
    }

}
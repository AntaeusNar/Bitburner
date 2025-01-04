/** Alice is our centralized Bitburner AI.
 * She will run all of the needed functions to allow for us to automate the game.
  */


/** Core Code
 * @param {NS} ns
 */
import { logger } from "./lib/library";
import { HackController } from "./classes/class.HackController";
export function main(ns){

    //Initial Launch
    logger(ns, 'Booting Alice....');
    let disabledLogs = [
        "getHackingLevel",
        "getServerMaxRam",
        "getServerMaxMoney",
        "getServerMinSecurityLevel",
        "getServerGrowth",
        "getServerRequiredHackingLevel",
        "getServerNumPortsRequired",
        "scan",
        "nuke",
    ];
    for (let log of disabledLogs) {
        ns.disableLog(log);
    }

    // batch controller initialization
    logger(ns, 'Initializing Batch Controller. Collecting Needed Files. Initializing network scan.');
    let hackController = new HackController(ns);
    hackController.printPriorities();
}
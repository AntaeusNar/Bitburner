/** Command and Control v4 */

import { HackVI } from "./class.hackVI";
import { Logger } from "./lib.misc";


/** Main Program loop
 * Runs any needed VIs
 * @param {NS} ns
 */
export async function main(ns) {

    /** Initialization / load from JSON / Load from Memory */
    let logger = new Logger(ns, 7);
    logger.emerg('Launching Command and Control v4.');
    ns.disableLog('ALL');

    let hVI = new HackVI(ns);



    // Main Control Loop
    while(true) {
        hVI.run();

    }

}
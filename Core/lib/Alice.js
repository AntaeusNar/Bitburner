/** Alice is our centralized Bitburner AI.
 * She will run all of the needed functions to allow for us to automate the game.
  */


/** Core Code
 * @param {NS} ns
 */
import { formatMoney, getNeededRam, logger, multiScan } from "./lib/library";
import { MyServer } from "./classes/class.MyServer";
import { base_delay, max_scripts } from "./lib/options";
export function main(ns){

    //Initial Launch
    logger(ns, 'Booting Alice....');

    // batch controller initialization
    logger(ns, 'Initializing Batch Controller. Collecting Needed Files. Initializing network scan.')
    let batch_files = ['./lib/lt-weaken.js', './lib/lt-grow.js', './lib/lt-hack.js'];
    let needed_ram = getNeededRam(ns, batch_files);
    let server_list = multiScan(ns, 'home');
    logger(ns, ns.sprintf('INFO: Found %d Servers on network. Building server inventory.', server_list.length));
    let server_inventory = [];
    server_list.forEach(element => {
        server_inventory.push(new MyServer(ns, element, needed_ram))
    });
    server_inventory = server_inventory.sort((a, b) => b.priority - a.priority);
    // Uncomment for review of Priorities
    initialDataReview(ns, logger, server_inventory, needed_ram, max_scripts);

}

/**
 * Will output general initial Data based on the MyServer Class and Alice's opinions
 * @param {NS} ns NS
 * @param {logger} logger logger function
 * @param {MyServer[]} server_inventory array of server class Objects
 * @param {number} needed_ram Ram per Thread
 * @param {number} max_scripts Max Scripts
 */
function initialDataReview(ns, logger, server_inventory, needed_ram, max_scripts) {
    let maxRam = server_inventory.reduce((n, {ramMax}) => n + ramMax, 0);
    let maxThreads = maxRam / needed_ram;

    let currentThreads = 0;
    let currentScripts = 0;
    let hitMaxThreads = false;
    let hitMaxScripts = false;

    for (const server of server_inventory) {
        if (currentThreads >= maxThreads && !hitMaxThreads) {
            logger(ns, ns.sprintf("INFO: Max Threads reached.  No more Servers can be hacked.  %d scripts remaining.", max_scripts - currentScripts));
            hitMaxThreads = true;
        }
        if (currentScripts >= max_scripts && !hitMaxScripts) {
            logger(ns, "INFO: Max Scripts reached. No more Servers can be hacked.");
            hitMaxScripts = true;
        }
        logger(ns, ns.sprintf('Hostname: %s, Priority($/Sec/Thread): %s, Max Threads/Cycle: %d, Min Scripts/Cycle: %d', server.hostname, formatMoney(server.priority), server.cycleMaxThreads, server.scriptsPerCycle));
        currentThreads += server.cycleMaxThreads;
        currentScripts += server.scriptsPerCycle;
    }
    logger(ns, ns.sprintf('INFO: Remaining Threads: %d, Remaining Scripts: %d', maxThreads - currentThreads, max_scripts - currentScripts));

}
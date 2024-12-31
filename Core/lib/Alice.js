/** Alice is our centralized Bitburner AI.
 * She will run all of the needed functions to allow for us to automate the game.
  */


/** Core Code
 * @param {NS} ns
 */
import { getNeededRam, logger, multiScan } from "./lib/library";
import { MyServer } from "./classes/class.MyServer";
import { base_delay, max_scripts } from "./lib/options";
export function main(ns){

    //Initial Launch
    logger(ns, 'Booting Alice....');

    // batch controller initialization
    logger(ns, 'Initializing Batch Controller. Collecting Needed Files. Initializing network scan.')
    let batch_files = ['./lib/lt-weaken.js', './lib/lt-grow.js', './lib/lt-hack.js'];
    let max_ram = getNeededRam(ns, batch_files);
    let server_list = multiScan(ns, 'home');
    logger(ns, ns.sprintf('INFO: Found %d Servers on network. Building server inventory.', server_list.length));
    let server_inventory = [];
    server_list.forEach(element => {
        server_inventory.push(new MyServer(ns, element, max_ram))
    });
    let batch_loop_info = {
        cycle: 1,
        batch: 1,
        sleep_time: base_delay,
        actual_num_batches: 0,
        script_pids: [],
        usable_scripts: max_scripts,
        usable_threads: threadsAvailableTotal(),
        set_restart: false,
    }

    /** Functions declared in scope to allow for lexical scoping */
    function ramAvailableTotal() {
        return server_inventory.reduce((n, {ramAvailable}) => n + ramAvailable, 0);
    }
    function threadsAvailableTotal() {
        return Math.floor((ramAvailableTotal() / max_ram));
    }
    function batchControl() {

    }

}
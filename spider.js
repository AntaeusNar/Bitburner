/** Spider
 * This program will do an initial map of the servers and generate some basic
 * info that will be passed as inventory.txt
 */

import {can, getRoot, getRatio} from "helperFunctions.js";

/** Given an array of files, returns the highest ram requirment
  * @param {ns} ns
  * @param {string[]} files
  * @returns {number} Needed Ram in GB
  */
function getNeededRam(ns, files) {
  	let needRam = 0;
  	for (let file of files) {
  		if (ns.getScriptRam(file) > needRam) {
  			needRam = ns.getScriptRam(file);
  		}
  	}
  	return needRam;
 }

/** Given a server hostname, will recusivly scan all connected servers
  * @param {ns} ns
  * @param {string} server hostname
  */
function multiscan(ns, server) {
	let serverList = [];
	function scanning(server) {
		let currentScan = ns.scan(server);
		currentScan.forEach(server => {
			if (!serverList.includes(server)) {
				serverList.push(server);
				scanning(server);
			}
		})
	}
	scanning(server);
	return serverList;
}

/** Given a server hostname, will getServer() and do other things
 * basicly expends getServer()
 * @param {ns} ns
 * @param {string} server hostname
 * @returns {Object} server
 */
function getModServerInfo(ns, server) {
  //get initail info
  objServer = ns.getServer(server);
  objServer.isTarget = false;
  objServer.isDrone = false;
  objServer.maxThreads = 0;
  objServer.priority = 0;
  objServer.cycleThreads = 0;

  //Checks/gets root access
  if (objServer.hasAdminRights || objServer.hostname == 'home' || getRoot(objServer)) {

    //checks and sets if server is a viable target
    if (objServer.moneyMax > 0) {
      objServer.isTarget = true;
      let returns = getRatio(ns, server, inventory.neededRam);
      objServer.priority = returns.ratio;
      objServer.cycleThreads = returns.cycleThreads;
    }

    //checks and sets if the server is a viable drone
    if (objServer.maxRam > inventory.neededRam) {
      objServer.isDrone = true;
      objServer.maxThreads = objServer.maxRam/inventory.neededRam;
    }
  }
  return objServer;
}

/** Given an array of server hostnames, will collect getServer info https://github.com/danielyxie/bitburner/blob/dev/markdown/bitburner.server.md
  * @param {ns} ns
  * @param {string[]} servers hostnames
  * @returns {object} returns
  * @returns {Object[]} returns.serverInventory - Server Interface
  * @returns {number} returns.maxThreads
  */
function getServerInventory(ns, servers) {
  let serverInventory = [];
  let maxThreads = 0;

  for (let i = 0; i < servers.length; i++) {
    serverInventory[i] = getModServerInfo(servers[i]);
    maxThreads += serverInventory[i].maxThreads;
  }
  let returns = {
    serverInventory: serverInventory,
    maxThreads: maxThreads,
  }
  return returns
}

/** @param {NS} ns */
export async function main(ns) {

  //initalization
  ns.tprint("Welcome to Spider: Scanning Network and Building Inventory");
  var inventory = {
    maxThreads: 0,
    neededRam: 0,
    files: [],
    servers: [],
  }

  //get current files
  ns.tprint("Grabbing files in /dronescripts/ and calculating maximum Ram needed per thread.")
  inventory.files = ns.ls("home", '/dronescripts');

  //calc needed ram
  inventory.neededRam = getNeededRam(ns, inventory.files);

  //scan the whole network and grab the server objects
  ns.tprint("Scanning Network and collecting server information.")
  let returns = getServerInventory(ns, multiscan(ns, 'home'));
  inventory.servers = returns.serverInventory;
  inventory.maxThreads = returns.maxThreads;

  //remove the old if it is there
  if (ns.fileExists('inventory.json')) {
    ns.rm('inventory.json');
    ns.tprint("Removing old JSON file.");
  }

  //output the inventory object as a JSON file
  ns.tprint("Creating Updated JSON file; please standby.");
  await ns.write('inventory.json', JSON.stringify(inventory, null, '\t'), 'w');

  //launch c_c
  ns.tprint("Launching C&C; please standby.");
  ns.spawn('c_c.js');
}

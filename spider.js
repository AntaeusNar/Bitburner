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
  let objServer = {}
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
      let returns = getRatio(ns, objServer, inventory.neededRam, .01);
      objServer.priority = returns.ratio;
      objServer.cycleThreads = returns.cycleThreads;
    }

    //checks and sets if the server is a viable drone
    if (objServer.maxRam > inventory.neededRam) {
      objServer.isDrone = true;
      objServer.maxThreads = objServer.maxRam/inventory.neededRam;
    }
  }

  objServer.adjustedRatio = objServer.priority;
  objServer.adjustedTake = .01;
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
    serverInventory[i] = getModServerInfo(ns, servers[i]);
    maxThreads += serverInventory[i].maxThreads;
  }
  let returns = {
    serverInventory: serverInventory,
    maxThreads: maxThreads,
  }
  return returns
}

/** Given an array of server objects, will adjust the take % of each up until
 * the new ratio is equal or greater then the next highest priority server objects
 * given prioirty
 * @param {ns} ns
 * @param {number} totalReservedThreads - cumulative number of threads reservered
 * @param {number} indexOfAlpha - index of servers to start compairson
 */
async function adjustTake(ns, totalReservedThreads, indexOfAlpha) {

  /** Setup */
  //select targets alpha and beta
  let targetAlpha = inventory.servers[indexOfAlpha];
  let targetBeta = inventory.servers[indexOfAlpha + 1];
  //if indexOfAlpha is out of index.....
  if (targetBeta == undefined) {
    targetBeta = targetAlpha;
  }

  if (totalReservedThreads == 0) {
    totalReservedThreads = targetAlpha.cycleThreads + targetBeta.cycleThreads;
  } else {
    totalReservedThreads += targetBeta.cycleThreads;
  }

  /** adjusting take perectange */
  while(targetAlpha.adjustedRatio != null
    && targetAlpha.adjustedRatio > targetBeta.adjustedRatio
    && totalReservedThreads < inventory.maxThreads) {
      let adjustedTake = Math.ceil((targetAlpha.adjustedTake + .01)*100)/100;
      ns.print("Adjusting the take perectange of " + targetAlpha.hostname + ", current take is " + targetAlpha.adjustedTake + " adjusted perectange is " + adjustedTake);

      if (adjustedTake <= .99) {
        let returns = getRatio(ns, targetAlpha, inventory.neededRam, adjustedTake);
        totalReservedThreads = totalReservedThreads + (returns.cycleThreads - targetAlpha.cycleThreads);
        targetAlpha.adjustedTake = adjustedTake;
        targetAlpha.adjustedRatio = returns.ratio;
        targetAlpha.cycleThreads = returns.cycleThreads;
        inventory.servers[indexOfAlpha] = targetAlpha;
        await ns.sleep(1);
      } else {
        break;
      }
    }
    ns.print("Adjustment completed: " + inventory.servers[indexOfAlpha].hostname + " updated to " + inventory.servers[indexOfAlpha].adjustedTake*100 + "%.");

    if (totalReservedThreads < inventory.maxThreads) {
      indexOfAlpha++;
      await adjustTake(ns, totalReservedThreads, indexOfAlpha);
    }

}


/** global scoping */
var inventory = {
  maxThreads: 0,
  neededRam: 0,
  files: [],
  servers: [],
}

/** @param {NS} ns */
export async function main(ns) {

  ns.disableLog("sleep");

  //initalization
  ns.tprint("Welcome to Spider: Scanning Network and Building Inventory");

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

  //sort the servers by priority
  ns.tprint("Sorting servers by priority.");
  inventory.servers.sort(function(a,b) {
    return (b.priority != null) - (a.priority != null) || b.priority - a.priority;
  });

  //adjust the take %
  ns.tprint("Adjusting the hack perectange to optimal conditions.")
  let totalReservedThreads = 0;
  let indexOfAlpha = 0;
  await adjustTake(ns, totalReservedThreads, indexOfAlpha);


  //remove the old if it is there
  if (ns.fileExists('inventory.txt')) {
    ns.rm('inventory.txt');
    ns.tprint("Removing old JSON file.");
  }

  //output the inventory object as a JSON file
  ns.tprint("Creating Updated JSON file; please standby.");
  await ns.write('inventory.txt', JSON.stringify(inventory, null, '\t'), 'w');

  //launch c_c
  ns.tprint("Launching C&C; please standby.");
  //ns.spawn('c_c.js');
}

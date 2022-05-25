/** Spider
 * This program will do an initial map of the servers and generate some basic
 * info that will be passed as inventory.txt
 */

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

  return objServer;
}

/** Given an array of server hostnames, will collect getServer info https://github.com/danielyxie/bitburner/blob/dev/markdown/bitburner.server.md
  * @param {ns} ns
  * @param {string[]} servers hostnames
  * @returns {Object[]} Server Interface
  */
function getServerInventory(ns, servers) {
  let serverInventory = [];

  for (let i = 0; i < servers.length; i++) {
    serverInventory[i] = getModServerInfo(servers[i]);
  }
  return serverInventory;
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
  inventory.files = ns.ls("home", '/dronescripts');

  //calc needed ram
  inventory.neededRam = getNeededRam(ns, inventory.files);

  //scan the whole network and grab the server objects
  inventory.servers = getServerInventory(ns, multiscan(ns, 'home'));

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

/** Spider
 * This program will do an initial map of the servers and generate some basic
 * info that will be passed as inventory.txt
 */

/** Checks to see if a file exsits on the home server
  * @param {ns} ns
  * @param {string} filename
  * @returns {boolean} true if exsits
  */
function can(ns, file) {
  	return ns.fileExists(file, "home");
  }

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

/** Given an array of server hostnames, will collect getServer info https://github.com/danielyxie/bitburner/blob/dev/markdown/bitburner.server.md
  * @param {ns} ns
  * @param {string[]} servers hostnames
  * @returns {Object[]} Server Interface
  */
function getServerInventory(ns, servers) {
    let serverInventory = [];
    for (i = 0, i < servers.length, i++) {
      serverInventory[i] = getServer(servers[i]);
    }
    return serverInventory;
  }

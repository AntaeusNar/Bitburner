/** Main Command and Control v4
 *
 * This Version incorporates spiderv2 for better capabilities
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

/** Given a server hostname, will attempt to gain root
 * @param {ns} ns
 * @param {string} hostname
 * @returns {boolean} result
 */
function getRoot(ns, target) {
 	let result = false;
 	let ports = 0;
 	if (ns.getServerRequiredHackingLevel(target) <= ns.getHackingLevel()) {
 		if (can(ns, "brutessh.exe")) { ns.brutessh(target); ++ports; }
 		if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(target); ++ports; }
 		if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(target); ++ports; }
 		if (can(ns, "httpworm.exe")) { ns.httpworm(target); ++ports; }
 		if (can(ns, "sqlinject.exe")) { ns.sqlinject(target); ++ports; }
 		if (ports >= ns.getServerNumPortsRequired(target)) {
 			ns.nuke(target);
 			if (ns.hasRootAccess(target)){
 				result = true;
 			}
 		}
 	}
 	return result;
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

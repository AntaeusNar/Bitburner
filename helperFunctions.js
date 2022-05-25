/** Just a collection of importable helper functions
 * note, please import as objects, NOT as *, think of the ram....
 */

 /** Checks to see if a file exsits on the home server
  * @param {ns} ns
  * @param {string} filename
  * @returns {boolean} true if exsits
  */
 function can(ns, file) {
  	return ns.fileExists(file, "home");
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

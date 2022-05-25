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

 /** Given a server object, will attempt to gain root
  * @param {ns} ns
  * @param {string} hostname
  * @returns {boolean} result
  */
 function getRoot(ns, target) {
  	let result = false;
  	let ports = 0;
  	if (target.requiredHackingSkill <= ns.getHackingLevel()) {
  		if (can(ns, "brutessh.exe")) { ns.brutessh(target.hostname); ++ports; }
  		if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(target.hostname); ++ports; }
  		if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(target.hostname); ++ports; }
  		if (can(ns, "httpworm.exe")) { ns.httpworm(target.hostname); ++ports; }
  		if (can(ns, "sqlinject.exe")) { ns.sqlinject(target.hostname); ++ports; }
  		if (ports >= target.numOpenPortsRequired) {
  			ns.nuke(target.hostname);
  			if (target.hasAdminRights){
  				result = true;
  			}
  		}
  	}
  	return result;
 }

/** Command and Control Master script
  * Version 1
  * Derived from c_cv3 and spiderv2
  *
  * This script will control network focused hacking efforts
  */

 /** Helper Type Functions */

/** Checks for existance of file on the spesified or home server
  * @param {NS} ns
  * @param {string} file - File Name
  * @param {string} [serverName=home] - hostname of server
  * @return {boolean} true if file exists on the server
  */
export function can(ns, file, serverName='home') {
	return ns.fileExists(file, serverName);
}

/** number of milliseconds to ISO date string 00:00:00.000
  * @param {number} milliseconds
  * @return {string} ISO format 00:00:00.000
  */
export function milString(milliseconds) {
  return new Date(milliseconds).toISOString().substr(11,12);
}

/** Given an array of files, will return the max ram requirements
  * @param {NS} ns
  * @param {array} files - list of file names
  * @return {number} maxium needed ram
  */
export function getNeededRam(ns, files) {
	let needRam = 0;
	for (let file of files) {
    if (can(file)) {
      if (ns.getScriptRam(file) > needRam) {
  			needRam = ns.getScriptRam(file);
  		}
    } else {
      ns.tprintf('WARNING: File %s not found on home, the ram calculation will be wrong.', file);
    }
	}
	return needRam;
}

/** Given a server, will recursivly scan until all servers are found
  * @param {NS} ns
  * @param {string} [serverName=home] - hostname of starting server
  * @return {array} list of all found server hostnames
  */
export function multiscan(ns, serverName='home') {
  let serverList = [];
  function scanning(serverName) {
    let currentScan = ns.scan(serverName);
    currentScan.forEach(serverName => {
      if (!serverList.includes(serverName)) {
        serverList.push(serverName);
        scanning(serverName);
      }
    })
  }
  scanning(serverName);
  return serverList;
}

/** Will attempt to gain root on server
  * @param {NS} ns
  * @param {string} serverName - hostname of server
  * @return {boolean} true if root was sucessful
  */
export function getRoot(ns, serverName) {
  let result = false;
	let ports = 0;
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
	return result;
}

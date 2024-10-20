/** Library of general functions and useful classes */

/** Logger Singleton class */
export class Logger {

    /**
     * Constructor
     * @param {NS} ns 
     * @param {number} logLevel level of log 0-7 {@link https://en.wikipedia.org/wiki/Syslog}
     */
    constructor(ns, logLevel) {
        this.ns = ns;
        this.logLevel = logLevel;
    }

    emerg(message) {
        this.ns.print(message);
        this.ns.tprint(message);
    }

    alert(message) {
        if (this.logLevel <= 1 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    crit(message) {
        if (this.logLevel <= 2 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    err(message) {
        if (this.logLevel <= 3 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    warning(message) {
        if (this.logLevel <= 4 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    notice(message) {
        if (this.logLevel <= 5 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    info(message) {
        if (this.logLevel <= 6 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }

    debug(message) {
        if (this.logLevel <= 7 ) { return }
        this.ns.print(message);
        this.ns.tprint(message);
    }
}

/** Given an array of files, will return the maximum ram requirement
 * @param {NS} ns
 * @param {String[]} files - list of file names
 * @return {number} max needed ram
 */
export function maxNeededRam(ns, files) {
	let needRam = 0;
	for (let file of files) {
    if (can(ns, file)) {
      if (ns.getScriptRam(file) > needRam) {
  			needRam = ns.getScriptRam(file);
  		}
    } else {
      ns.tprintf('WARNING: File %s not found on home, the ram calculation will be wrong.', file);
    }
	}
	return needRam;
}

/** Given a server, will recursively scan until all servers are found.
 * @param {NS} ns
 * @param {String} [serverName=home] hostname of starting server
 * @return {String[]} list of all found server hostnames
 */
export function recServerScan(ns, serverName='home') {

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

/** Checks for existence of file on the specified or home server
  * @param {NS} ns
  * @param {string} file - File Name
  * @param {string} [serverName=home] - hostname of server
  * @return {boolean} true if file exists on the server
  */
export function can(ns, file, serverName='home') {
	return ns.fileExists(file, serverName);
}

/** Tries to get Root given a Server
 * @param {NS} _ns
 * @param {Server} server
 */
export function tryGetRoot(_ns, server) {
    if (server.hasAdminRights) {
        return;
    }
    if (server.numOpenPortsRequired > server.openPortCount) {
        if (can(_ns, 'brutessh.exe')) { _ns.brutessh(server.hostname)}
        if (can(_ns, 'ftpcrack.exe')) { _ns.ftpcrack(server.hostname)}
        if (can(_ns, 'relaysmtp.exe')) { _ns.relaysmtp(server.hostname)}
        if (can(_ns, 'httpworm.exe')) { _ns.httpworm(server.hostname)}
        if (can(_ns, 'sqlinject.exe')) { _ns.sqlinject(server.hostname)}
    }
    if (server.numOpenPortsRequired > server.openPortCount) {
        return;
    }
    _ns.nuke(server.hostname);
    return;
}
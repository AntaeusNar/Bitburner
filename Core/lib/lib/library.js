/** Given a server hostname, will attempt to gain root
* @param {ns} ns
* @param {string} hostname
* @returns {boolean} result
*/
export function getRoot(ns, hostname) {
    let result = false;
    let ports = 0;
        if (can(ns, "brutessh.exe")) { ns.brutessh(hostname); ++ports; }
        if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(hostname); ++ports; }
        if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(hostname); ++ports; }
        if (can(ns, "httpworm.exe")) { ns.httpworm(hostname); ++ports; }
        if (can(ns, "sqlinject.exe")) { ns.sqlinject(hostname); ++ports; }
        if (ports >= ns.getServerNumPortsRequired(hostname)) {
            ns.nuke(hostname);
            if (ns.hasRootAccess(hostname)){
                result = true;
            }
        }
    return result;
}
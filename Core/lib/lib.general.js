import { localBitNodeMultipliers } from "./options.bitNode";
import { currentBitNode } from "./options.general";


const BitMults = localBitNodeMultipliers(currentBitNode.n, currentBitNode.lvl);

/** Checks for existence of file on the specified or home server
  * @param {NS} ns
  * @param {string} file - File Name
  * @param {string} [serverName=home] - hostname of server
  * @return {boolean} true if file exists on the server
  */
export function can(ns, file, serverName='home') {
	return ns.fileExists(file, serverName);
}

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

/** Given a server, will recursively scan until all servers are found
  * @param {NS} ns
  * @param {string} [serverName=home] - hostname of starting server
  * @return {array} list of all found server hostnames
  */
export function multiScan(ns, serverName='home') {
  let serverList = [];
  function scanning(serverName) {
    let currentScan = ns.scan(serverName);
    currentScan.forEach(serverName => {
      if (!serverList.includes(serverName)) {
        serverList.push(serverName);
        getRoot(ns, serverName);
        scanning(serverName);
      }
    })
  }
  scanning(serverName);
  return serverList;
}

/**
 * Returns time it takes to complete a grow on a server, in seconds
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts#80
 * @param {MyServer} server
 * @param {Object} player
 * @param {boolean} [planning = false]
 * @returns {number} seconds
 */
export function calculateGrowTime(server, player, planning = false) {
    const growthTimeMultiplier = 3.2;
    return growthTimeMultiplier * calculateHackingTime(server, player, planning);
}

/**
 * Returns time it takes to complete a weaken on a server, in seconds
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts#L87
 * @param {MyServer} server
 * @param {Object} player
 * @param {boolean} [planning = false]
 * @returns {number} seconds
 */
export function calculateWeakenTime(server, player, planning = false) {
    const weakenTimeMultiplier = 4;
    return weakenTimeMultiplier * calculateHackingTime(server, player, planning)
}

/**
 * Returns time it takes to complete a hack on a server, in seconds
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts#L58
 * @param {MyServer} server
 * @param {Object} player
 * @param {boolean} [planning = false]
 * @returns {number} seconds
 */
export function calculateHackingTime(server, player, planning = false) {
    const serverSecurity = planning ? server.minDifficulty : server.currentDifficulty;
    const difficultyMult = server.requiredHackingSkill * serverSecurity;

    const baseDiff = 500;
    const baseSkill = 50;
    const diffFactor = 2.5;
    let skillFactor = diffFactor * difficultyMult + baseDiff;
    skillFactor /= player.skills.hacking + baseSkill;

    const hackTimeMultiplier = 5;
    const hackingTime =
      (hackTimeMultiplier * skillFactor) /
      (player.mults.hacking_speed *
        BitMults.HackingSpeedMultiplier *
        calculateIntelligenceBonus(player.skills.intelligence, 1));

    return hackingTime;
}

/**calculate Intelligence bonus
 * ->https://github.com/danielyxie/bitburner/blob/dev/src/PersonObjects/formulas/intelligence.ts
 * @param {number} intelligence
 * @param {number} weight
 * @return {number}
 */
export function calculateIntelligenceBonus(intelligence, weight) {
    return 1 + (weight * Math.pow(intelligence, 0.8))/600;
}
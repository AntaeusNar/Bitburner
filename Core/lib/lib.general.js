import { localBitNodeMultipliers } from "./options.bitNode";
import { currentBitNode, ServerConstants } from "./options.general";

const BitMults = localBitNodeMultipliers(currentBitNode.n, currentBitNode.lvl);

/**
 * Clamps the value on a lower and an upper bound
 * @param {number} value Value to clamp
 * @param {number} min Lower bound, defaults to negative Number.MAX_VALUE
 * @param {number} max Upper bound, defaults to Number.MAX_VALUE
 * @returns {number} Clamped value
 */
export function clampNumber(value, min = -Number.MAX_VALUE, max = Number.MAX_VALUE) {
    return Math.max(Math.min(value, max), min);
}

/** Logger print function
 * @param {NS} ns
 * @param {string} message
 * @param {number} [options=2] - 0 program log, 1 terminal log, 2 both
 */
export function logger(ns, message, options=2) {
  switch (options) {
    case 0:
      ns.print(message);
      break;
    case 1:
      ns.tprint(message);
      break;
    case 2:
    default:
      ns.print(message);
      ns.tprint(message);
  }
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

/**
 * Returns the number of weaken threads needed to weaken a server by an amount
 * @param {number} fortifiedAmount Amount to weaken a server by
 * @param {number} [cores = 1]
 * @returns
 */
export function calcWeakenThreads(fortifiedAmount, cores = 1) {
    return fortifiedAmount/getWeakenEffect(cores);
}

/**
 * Returns the actual weaken effect of one thread
 * @param {number} [cores = 1] number of cores on attacking server
 * @returns
 */
export function getWeakenEffect(cores = 1) {
    const coreBonus = 1 + (cores - 1) * (1 / 16);
    return ServerConstants.ServerWeakenAmount * coreBonus * BitMults.ServerWeakenRate;
}

/** Calculates the % of money that will be stolen from a server if
 * it is successfully hacked per single thread as a decimal
 * https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts
 * @param {MyServer} server
 * @param {Object} player
 * @param {Boolean} [planning=false] if true, uses the minDifficulty
 * @returns {number} as a decimal
 */
export function calcPercentMoneyHacked(server, player, planning = false) {
    const hackDifficulty = planning ? server.minDifficulty : server.currentDifficulty;
    const hackingSkill = planning ? Math.max(server.requiredHackingSkill, player.skills.hacking) : player.skills.hacking;
    const requiredHackingSkill = server.requiredHackingSkill;
    const balanceFactor = 240;
    const difficultyMult = (100 - hackDifficulty) / 100;
    const skillMult = (hackingSkill - (requiredHackingSkill - 1)) / hackingSkill;
    const percentMoneyHacked = (difficultyMult * skillMult * player.mults.hacking_money * BitMults.ScriptHackMoney) / balanceFactor;
    return Math.min(1, Math.max(percentMoneyHacked, 0));
}

/**
 * Returns the chance the person has to successfully hack a server
 * https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts
 * @param {MyServer} server
  * @param {Object} player
  * @param {Boolean} [planning=false] if true, uses the minDifficulty
  * @returns {number} chance of hack success as decimal
  */
 export function calcHackChance(server, player, planning = false) {
    const hackDifficulty = planning ? server.minDifficulty : server.currentDifficulty;
    const hackingSkill = planning ? Math.max(server.requiredHackingSkill, player.skills.hacking) : player.skills.hacking;
    const requiredHackingSkill = server.requiredHackingSkill;
    const hackFactor = 1.75;
    const difficultyMult = (100 - hackDifficulty) / 100;
    const skillMult = clampNumber(hackFactor * hackingSkill, 1);
    const skillChance = (skillMult - requiredHackingSkill) / skillMult
    const chance = skillChance * difficultyMult * player.mults.hacking_chance * calculateIntelligenceBonus(player.skills.intelligence, 1);
    return clampNumber(chance, 0 , 1);
 }

/**
 * Calculates the number of threads needed to hack a percent of a servers money
 * @param {Myserver} server
 * @param {Object} player
 * @param {boolean} [planning = false]
 * @returns
 */
export function calcHackThreads(server, player, planning = false) {
  let percent = calcPercentMoneyHacked(server, player, planning);
  if (isNaN(percent)) { throw new Error(server.hostname + ' calcPercentMoneyHacked is NaN && planning is ' + planning); }
  let chance = calcHackChance(server, player, planning);
  return server.percent / (percent * chance);
}

/**
 * Returns the log of the growth rate. When passing 1 for the threads, this gives a useful constant.
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Server/formulas/grow.ts#L6
 * @param {BaseServer} server
 * @param {Object} player
 * @param {boolean} [planning = false]
 * @param {number} [threads = 1]
 * @param {number} [cores = 1]
 * @returns {number}
 */
export function calcServerGrowthLog(server, player, planning = false, threads = 1, cores = 1) {
    const numServerGrowthCycles = Math.max(threads, 0);
    const serverSecurity = planning ? server.minDifficulty : server.currentDifficulty;

    //Get adjusted growth log, which accounts for server security
    //log1p computes log(1+p), it is far more accurate for small values.
    let adjGrowthLog = Math.log1p(ServerConstants.ServerBaseGrowthIncr / serverSecurity);
    if (adjGrowthLog >= ServerConstants.ServerMaxGrowthLog) {
      adjGrowthLog = ServerConstants.ServerMaxGrowthLog;
    }

    //Calculate adjusted server growth rate based on parameters
    const serverGrowthPercentage = server.growthMultiplier / 100;
    const serverGrowthPercentageAdjusted = serverGrowthPercentage * BitMults.ServerGrowthRate;

    //Apply serverGrowth for the calculated number of growth cycles
    const coreBonus = 1 + (cores - 1) * (1 / 16);
    // It is critical that numServerGrowthCycles (aka threads) is multiplied last,
    // so that it rounds the same way as numCycleForGrowthCorrected.
    return adjGrowthLog * serverGrowthPercentageAdjusted * player.mults.hacking_grow * coreBonus * numServerGrowthCycles;
}

/**
 * Calculates the number of Grow threads needed to grow a server
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Server/ServerHelpers.ts#L58 
 * @param {BaseServer} server
 * @param {Object} player
 * @param {number} targetMoney
 * @param {number} startingMoney
 * @param {boolean} [planning = false]
 * @param {number} [cores = 1] Number of cores used on attacking server
 * @returns
 */
export function calcGrowThreads(server, player, targetMoney, startingMoney, planning = false, cores = 1) {

    const k = calcServerGrowthLog(server, player, planning, 1, cores);
    if (isNaN(k)) { throw new Error('calcServerGrowthLog in calcGrowThreads got a k of NaN'); }

    const guess = (targetMoney - startingMoney) / (1 + (targetMoney * (1 / 16) + startingMoney * (15 / 16)) * k);
    let x = guess;
    let diff;
    do {
      const ox = startingMoney + x;
      // Have to use division instead of multiplication by inverse, because
      // if targetMoney is MIN_VALUE then inverting gives Infinity
      const newx = (x - ox * Math.log(ox / targetMoney)) / (1 + ox * k);
      diff = newx - x;
      x = newx;
    } while (diff < -1 || diff > 1);
    /* If we see a diff of 1 or less we know all future diffs will be smaller, and the rate of
     * convergence means the *sum* of the diffs will be less than 1.

     * In most cases, our result here will be ceil(x).
     */
    const ccycle = Math.ceil(x);
    if (ccycle - x > 0.999999) {
      // Rounding-error path: It's possible that we slightly overshot the integer value due to
      // rounding error, and more specifically precision issues with log and the size difference of
      // startingMoney vs. x. See if a smaller integer works. Most of the time, x was not close enough
      // that we need to try.
      const fcycle = ccycle - 1;
      if (targetMoney <= (startingMoney + fcycle) * Math.exp(k * fcycle)) {
        return fcycle;
      }
    }
    if (ccycle >= x + ((diff <= 0 ? -diff : diff) + 0.000001)) {
      // Fast-path: We know the true value is somewhere in the range [x, x + |diff|] but the next
      // greatest integer is past this. Since we have to round up grows anyway, we can return this
      // with no more calculation. We need some slop due to rounding errors - we can't fast-path
      // a value that is too small.
      return ccycle;
    }
    if (targetMoney <= (startingMoney + ccycle) * Math.exp(k * ccycle)) {
      return ccycle;
    }
    return ccycle + 1;
}

/** Given an array of files, will return the max ram requirements
  * @param {NS} ns
  * @param {string[]} files - list of file names
  * @return {number} maximum needed ram
  */
export function getNeededRam(ns, files) {
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

/**
 * Pathto finds the path of servers between a source and destination.
 *
 * @param {NS} ns
 * @param {String} dest the hostname to try to find a path to
 * @param {String} src the hostname to start at
 * @param {Array} tosrc used for internal recursion
 * @param {Set} seen used for internal recursion
 * @returns {Array} the path from src to dest, or null if no path exists
 */
export function pathto(ns, dest, src = ns.getHostname(), tosrc = [src], seen = new Set()) {
	seen.add(src);
	if (dest == src) return tosrc;

	for (const peer of ns.scan(src)) {
		if (seen.has(peer)) continue;
		tosrc.push(peer);
		var path = pathto(ns, dest, peer, tosrc, seen);
		if (path != null) return path;
		// No path via this peer.
		tosrc.pop();
	}

	// No path from this src
	return null;
}

/**
  * BackdoorTo takes a destination and returns a copy/pastable string to get backdoor on that destination
  * @param {NS} ns
  * @param {String} dest the hostanme of the destination
  * @returns {String} the command string
  */
export function backdoorTo(ns, dest) {
  let path = pathto(ns, dest);
  path.shift();
  for (let i = 0; i < path.length;  i++) {
    path[i] = ' connect ' + path[i];
  }
  path.push(' backdoor');
  let pathString = path.join(';');
  return pathString;
}
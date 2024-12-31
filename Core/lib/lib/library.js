import { ServerConstants, base_delay, currentNodeMults } from "./options";

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

/** Checks for existence of file on the specified or home server
  * @param {NS} ns
  * @param {string} file - File Name
  * @param {string} [serverName=home] - hostname of server
  * @return {boolean} true if file exists on the server
  */
export function can(ns, file, serverName='home') {
	return ns.fileExists(file, serverName);
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
 * Returns the log of the growth rate. When passing 1 for the threads, this gives a useful constant.
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Server/formulas/grow.ts#L6
 * @param {number} serverGrowthMultiplier ns.getServerGrowth()
 * @param {number} serverSecurity Security level of target server to base calc on
 * @param {number} playerGrowthMultiplier ns.getHackingMultipliers().growth
 * @param {number} [cores = 1] Number of cores used on attacking server
 * @param {number} [threads = 1] Number of threads used on attacking server
 * @returns
 */
export function calcServerGrowthLog(serverGrowthMultiplier, serverSecurity, playerGrowthMultiplier, cores = 1, threads = 1) {
    const numServerGrowthCycles = Math.max(threads, 0);

    //Get adjusted growth log, which accounts for server security
    //log1p computes log(1+p), it is far more accurate for small values.
    let adjGrowthLog = Math.log1p(ServerConstants.ServerBaseGrowthIncr / serverSecurity);
    if (adjGrowthLog >= ServerConstants.ServerMaxGrowthLog) {
      adjGrowthLog = ServerConstants.ServerMaxGrowthLog;
    }

    //Calculate adjusted server growth rate based on parameters
    const serverGrowthPercentage = serverGrowthMultiplier / 100;
    const serverGrowthPercentageAdjusted = serverGrowthPercentage * currentNodeMults.ServerGrowthRate;

    //Apply serverGrowth for the calculated number of growth cycles
    const coreBonus = 1 + (cores - 1) * (1 / 16);
    // It is critical that numServerGrowthCycles (aka threads) is multiplied last,
    // so that it rounds the same way as numCycleForGrowthCorrected.
    return adjGrowthLog * serverGrowthPercentageAdjusted * playerGrowthMultiplier * coreBonus * numServerGrowthCycles;
}

/**
 * Calculates the number of Grow threads needed to grow a server
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Server/ServerHelpers.ts#L58 
 * @param {number} serverGrowthMultiplier ns.getServerGrowth()
 * @param {number} serverSecurity Security level of target server to base calc on
 * @param {number} playerGrowthMultiplier ns.getHackingMultipliers().growth
 * @param {number} targetMoney How much to grow the server TO; ns.getServerMaxMoney(hostname) is ideal
 * @param {number} startingMoney How much to grow the server FROM; 0 is ideal
 * @param {number} [cores = 1] Number of cores used on attacking server
 * @returns
 */
export function calcGrowThreads(serverGrowthMultiplier, serverSecurity, playerGrowthMultiplier, targetMoney, startingMoney, cores = 1) {

    const k = calcServerGrowthLog(serverGrowthMultiplier, serverSecurity, playerGrowthMultiplier, cores, 1);

    const guess = (targetMoney - startingMoney) / (1 + (targetMoney * (1 / 16) + startMoney * (15 / 16)) * k);
    let x = guess;
    let diff;
    do {
      const ox = startMoney + x;
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
      // startMoney vs. x. See if a smaller integer works. Most of the time, x was not close enough
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

/**
 * Returns the percentage of money that will be stolen from a server if
 * it is successfully hacked per single thread (returns the decimal form, not the actual percent value)
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerHackingMultiplier ns.getHackingMultipliers().money
 * @returns
 */
export function calcPercentMoneyHacked(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingMultiplier) {
    const hackDifficulty = serverSecurity ?? 100;
    if (hackDifficulty >= 100) return 0;
    const requiredHackingSkill = serverRequiredHackingSkill ?? 1e9;
    // Adjust if needed for balancing. This is the divisor for the final calculation
    const balanceFactor = 240;

    const difficultyMult = (100 - hackDifficulty) / 100;
    const skillMult = (playerHackingSkillLevel - (requiredHackingSkill - 1)) / playerHackingSkillLevel;
    const percentMoneyHacked =
      (difficultyMult * skillMult * playerHackingMultiplier * currentNodeMults.ScriptHackMoney) / balanceFactor;

    return Math.min(1, Math.max(percentMoneyHacked, 0));
}

/**
 * Returns the chance the person has to successfully hack a server
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerHackingChance ns.getHackingMultipliers().chance
 * @returns
 */
export function calcHackChance(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingChance) {
    const hackDifficulty = serverSecurity ?? 100;
    const requiredHackingSkill = serverRequiredHackingSkill ?? 1e9;
    const hackFactor = 1.75;
    const difficultyMult = (100 - hackDifficulty) / 100;
    const skillMult = clampNumber(hackFactor * playerHackingSkillLevel, 1);
    const skillChance = (skillMult - requiredHackingSkill) / skillMult;
    // TODO: this is a hack for the intelligece bonus....
    const chance = skillChance * difficultyMult * playerHackingChance * (1 + (1 * Math.pow(1, 0.8)) / 600);
    return clampNumber(chance, 0, 1);
}

/**
 * Calculates the number of threads needed to hack a percent of a servers money
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerHackingChance ns.getHackingMultipliers().chance
 * @param {number} playerHackingMultiplier ns.getHackingMultipliers().money
 * @param {number} [targetHackPercent = 100] percent of maxMoney to hack
 * @returns
 */
export function calcHackThreads(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingChance, playerHackingMultiplier, targetHackPercent = 100) {
    return targetHackPercent / (calcPercentMoneyHacked(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingMultiplier) * calcHackChance(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingChance));
}

/**
 * Returns the actual weaken effect of one thread
 * @param {number} [cores = 1] number of cores on attacking server
 * @returns 
 */
export function getWeakenEffect(cores = 1) {
    const coreBonus = 1 + (cores - 1) * (1 / 16);
    return ServerConstants.ServerWeakenAmount * coreBonus * currentNodeMults.ServerWeakenRate;
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
 * Returns time it takes to complete a hack on a server, in seconds
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts#L58
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerSpeedMultiplier ns.getHackingMultipliers().speed
 * @returns
 */
export function calculateHackingTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier) {
    const difficultyMult = serverRequiredHackingSkill * serverSecurity;

    const baseDiff = 500;
    const baseSkill = 50;
    const diffFactor = 2.5;
    let skillFactor = diffFactor * difficultyMult + baseDiff;
    skillFactor /= playerHackingSkillLevel + baseSkill;

    const hackTimeMultiplier = 5;
    // TODO: this is a hack for the intelligece bonus....
    const hackingTime =
      (hackTimeMultiplier * skillFactor) /
      (playerSpeedMultiplier *
        currentNodeMults.HackingSpeedMultiplier *
        (1 + (1 * Math.pow(1, 0.8)) / 600));

    return hackingTime;
}

/**
 * Returns time it takes to complete a grow on a server, in seconds
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts#80
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerSpeedMultiplier ns.getHackingMultipliers().speed
 * @returns
 */
export function calculateGrowTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier) {
    const growthTimeMultiplier = 3.2;
    return growthTimeMultiplier * calculateHackingTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier);
}

/**
 * Returns time it takes to complete a weaken on a server, in seconds
 * -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts#L87
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerSpeedMultiplier ns.getHackingMultipliers().speed
 * @returns
 */
export function calculateWeakenTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier) {
    const weakenTimeMultiplier = 4;
    return weakenTimeMultiplier * calculateHackingTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier)
}

/**
 * Returns the total time of one single batch
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerSpeedMultiplier ns.getHackingMultipliers().speed
 * @returns
 */
export function calculateSingleBatchTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier) {
    let growTime = calculateGrowTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier);
    let hackTime = calculateHackingTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier);
    let weakenTime = calculateWeakenTime(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerSpeedMultiplier);
    return Math.max(growTime, weakenTime + base_delay, hackTime + base_delay*2, weakenTime + base_delay * 3)
}


/**
 * Calculates the number of needed threads in each batch of one cycle of GWHW
 * @param {number} serverRequiredHackingSkill ns.getServerRequiredHackingLevel
 * @param {number} serverSecurity ns.getServerMinSecurityLevel for ideal
 * @param {number} playerHackingSkillLevel ns.getHackingLevel
 * @param {number} playerHackingChance ns.getHackingMultipliers().chance
 * @param {number} playerHackingMultiplier ns.getHackingMultipliers().money
 * @param {number} serverGrowthMultiplier ns.getServerGrowth()
 * @param {number} playerGrowthMultiplier ns.getHackingMultipliers().growth
 * @param {number} targetMoney How much to grow the server TO; ns.getServerMaxMoney(hostname) is ideal
 * @param {number} startingMoney How much to grow the server FROM; 0 is ideal
 * @param {number} [targetHackPercent=100] percent of maxMoney to hack
 * @param {number} [cores=1] Number of cores used on attacking server
 * @returns object containing the threads as GWgHWh
 */
export function calculateSingleBatchThreads(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingChance, playerHackingMultiplier, serverGrowthMultiplier, playerGrowthMultiplier, targetMoney, startingMoney, targetHackPercent = 100 ,cores = 1) {
    let growthThreads = calcGrowThreads(serverGrowthMultiplier, serverSecurity, playerGrowthMultiplier, targetMoney, startingMoney);
    let growWeakenThreads = calcWeakenThreads(growthThreads * 0.002, cores);
    let hackThreads = calcHackThreads(serverRequiredHackingSkill, serverSecurity, playerHackingSkillLevel, playerHackingChance, playerHackingMultiplier, targetHackPercent);
    let hackWeakenThreads = calcWeakenThreads(hackThreads * 0.002, cores);

    return threads = {
        G: growthThreads,
        Wg: growWeakenThreads,
        H: hackThreads,
        Wh: hackWeakenThreads,
    }
}
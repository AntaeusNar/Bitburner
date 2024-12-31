import { calcHackChance, calcPercentMoneyHacked, calculateSingleBatchThreads, calculateSingleBatchTime, getRoot } from "../lib/library.js";

/**
 * Represents a server in Bitburner.
 *
 * This class is used to create actual objects that represent servers, providing useful
 * methods and properties for interacting with the server in a more manageable way.
 * It generates both the NS version and the getServer version, which do not seem to match
 * but are unified through this class.
 *
 * @class MyServer
 */
export class MyServer {

    /**
     * Creates a MyServer instance from a given hostname.
     *
     * @param {NS} ns - The Bitburner NS object used for NS interaction.
     * @param {string} hostname - The hostname of the server to represent.
     * @param {number} [neededRam=1.75] - The amount of RAM required for operations on the server (default is 1.75).
     */
    constructor(ns, hostname, neededRam=1.75) {
        /** @type {string} */
        this.hostname = hostname;

        /** @type {number} */
        this.ramMax = ns.getServerMaxRam(hostname);

        /** @type {number} */
        this.ramNeeded = neededRam;

        /** @type {number} */
        this.moneyMax = ns.getServerMaxMoney(hostname);

        /** @type {number} */
        this.securityMin = ns.getServerMinSecurityLevel(hostname);

        /** @type {number} */
        this.growthMultiplier = ns.getServerGrowth(hostname);

        /** @type {number} */
        this.hackRequired = ns.getServerRequiredHackingLevel(hostname);

        /** @type {NS} */
        this.ns = ns;
    }

    /**
     * Gets the root access status of the server.
     *
     * @returns {boolean} Returns true if the server has root access.
     */
    get root() {
        return getRoot(this.ns, this.hostname);
    }

    /**
     * Gets the hackable status of the server.
     *
     * @returns {boolean} Returns true if the server can be hacked.
     */
    get isHackable() {
        if (this.hackRequired > this.ns.getHackingLevel()) {
            return false;
        }
        return true;
    }

    /**
     * Gets the amount of RAM currently used by the server.
     *
     * @returns {number} The amount of RAM used on the server.
     */
    get ramUsed() {
        return this.ns.getServerUsedRam(this.hostname);
    }

    /**
     * Gets the available RAM on the server (max RAM - used RAM).
     *
     * @returns {number} The available RAM on the server if the server is rooted.
     */
    get ramAvailable() {
        if (!this.root) {
            return 0;
        }
        return this.ramMax - this.ramUsed;
    }

    /**
     * Gets the current security level of the server.
     *
     * @returns {number} The current security level of the server.
     */
    get securityCurrent() {
        return this.ns.getServerSecurityLevel(this.hostname);
    }

    /**
     * Checks if the server's security is at its minimum (primed for hacking).
     *
     * @returns {boolean} True if the server's security is at its minimum level.
     */
    get securityIsPrimed() {
        return this.securityCurrent === this.securityMin;
    }

    /**
     * Gets the available money on the server.
     *
     * @returns {number} The amount of money available on the server.
     */
    get moneyAvailable() {
        if (!this.isHackable) {
            return 0;
        }
        return this.ns.getServerMoneyAvailable(this.hostname);
    }

    /**
     * Checks if the server's money is at its maximum (primed for hacking).
     *
     * @returns {boolean} True if the server's money is at its maximum.
     */
    get moneyIsPrimed() {
        return this.moneyAvailable === this.moneyMax;
    }

    /**
     * Gets the time it takes to grow the server's money.
     *
     * @returns {number} The time required for the grow operation.
     * @see {NS.getGrowTime}
     */
    get growTime() {
        return this.ns.getGrowTime(this.hostname);
    }

    /**
     * Gets the time it takes to hack the server.
     *
     * @returns {number} The time required for the hack operation.
     * @see {NS.getHackTime}
     */
    get hackTime() {
        return this.ns.getHackTime(this.hostname);
    }

    /**
     * Gets the time it takes to weaken the server's security.
     *
     * @returns {number} The time required for the weaken operation.
     * @see {NS.getWeakenTime}
     */
    get weakenTime() {
        return this.ns.getWeakenTime(this.hostname);
    }

    /**
     * Gets the list of processes running on the server.
     *
     * @returns {Array<Object>} List of processes running on the server.
     * @see {NS.ps}
     */
    get ps() {
        return this.ns.ps(this.hostname);
    }

    /**
     * Gets the list of files on the server.
     *
     * @returns {Array<string>} List of file paths on the server.
     * @see {NS.ls}
     */
    get ls() {
        return this.ns.ls(this.hostname);
    }

    get priority() {
        let chance = calcHackChance(this.hackRequired, this.securityMin, this.ns.getHackingLevel(), this.ns.getHackingMultipliers().chance);
        let percent = calcPercentMoneyHacked(this.hackRequired, this.securityMin, this.ns.getHackingLevel(), this.ns.getHackingMultipliers().money);
        let maxTime = calculateSingleBatchTime(this.hackRequired, this.securityMin, this.ns.getHackingLevel(), this.ns.getHackingMultipliers().speed);
        let threads = calculateSingleBatchThreads(
            this.hackRequired,
            this.securityMin,
            this.ns.getHackingLevel,
            this.ns.getHackingMultipliers().chance,
            this.ns.getHackingMultipliers().money,
            this.growthMultiplier,
            this.ns.getHackingMultipliers().growth,
            this.moneyMax,
            0,
            100
        ).reduce((a, c) => a + c);

        return (chance * percent * this.moneyMax) / maxTime / threads;
    }

}

/** Notes on calculating priority = ei finding the best target
 * ->https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts
 *
 * There are two types, best for money and best for hacking skill
 *
 * Best for money
 * The best target is the one that will provide the most money in the least amount of time with the least amount of thread.
 * This can be calculated loosely as:
 * (ChanceForHackToWork * PercentOfMoneyPerHack * MaxMoneyOnServer)/TimePerGWHWCycle/TotalThreads
 * The actual numbers require knowing a lot about the bitnode and the player that are locked
 * behind either formulas.exe or need to be pulled from the source code.
 * because the player and the bitnode information are constant across all servers we are trying to hack
 * at a single moment in time (while the script is running) we can create a formula with that info removed out
 * (ei it will be 'constant')
 * 
 * Therefore:
 * ChanceForHackToWork = skillChance * difficultyMult * person.mults.hacking_chance * calculatedIntelligenceBonus
 * ChanceForHackToWork = skillChance * difficultyMult
 * ChanceForHackToWork = ((skillMult - requiredHackingSkill) / skillMult) * difficultyMult
 * ChanceForHackToWork = (((hackFactor * persons.skills.hacking) - requiredHackingSkill) / (hackingFactor * persons.skills.hacking)) * difficultyMult
 * ChanceForHackToWork = (((1.75 * 1) - requiredHackingSkill) / (1.75 * 1)) * difficultyMult
 * ChanceForHackToWork = ((1.75 - requiredHackingSkill) / 1.75) * difficultyMult
 * ChanceForHackToWork = ((1.75 - requiredHackingSkill) / 1.75) * ((100 - server.hackDifficulty) / 100)
 * ChanceForHackToWork = ((1.75 - MyServer.hackRequired) / 1.75) ((100 - MyServer.securityMin) / 100)
 * 
 * PercentPerHack = (difficultyMult * skillMult * person.mults.hacking_money * currentNodeMults.ScriptedHackMoney) / balanceFactor
 * PercentPerHack = (difficultyMult * skillMult * 1 * 1) / balanceFactor
 * PercentPerHack = (difficultyMult * skillMult) / balanceFactor
 * PercentPerHack = (((100 - hackDifficulty) / 100)) * skillMult) / balanceFactor
 * PercentPerHack = (((100 - MyServer.securityMin) / 100)) * skillMult) / balanceFactor
 * PercentPerHack = (((100 - MyServer.securityMin) / 100)) * ((person.skills.hacking - (requiredHackingSkill - 1)) / person.skills.hacking)) / balanceFactor
 * PercentPerHack = (((100 - MyServer.securityMin) / 100)) * ((1 - (requiredHackingSkill - 1)) / 1)) / balanceFactor
 * PercentPerHack = (((100 - MyServer.securityMin) / 100)) * (1 - (requiredHackingSkill - 1))) / balanceFactor
 * PercentPerHack = (((100 - MyServer.securityMin) / 100)) * (1 - (MyServer.hackRequired - 1))) / 240
 * 
 * MaxMoneyOnServer = MyServer.moneyMax
 * 
 * TimePerGWHWCycle = Math.max((growTime), (weakenTime + delay), (hackTime + delay*2), (weakenTime + delay*3))
 * TimePerGWHWCycle = Math.max((hackTime*3.2), (hackTime*4 + delay), (hackTime + delay*2), (hackTime*4 + delay*3))
 * TimePerGWHWCylce = hackTime*4 + delay*3
 * TimePerGWHWCylce = hackTime*4 + 1*3
 * TImePerGWHWCycle = hackTime*4 + 3
 * TimePerGWHWCycle = (hackTimeMultiplier * skillFactor) / (person.mults.hacking_speed * currentNodeMults.HackingSpeedMultiplier * calculatedIntelligenceBonus(person.skills.intelligence, 1)) + 3
 * TimePerGWHWCycle = (hackTimeMultiplier * skillFactor) / (1 * 1 * 1) + 3
 * TimePerGWHWCycle = (hackTimeMultiplier * skillFactor) / 1 + 3
 * TimePerGWHWCycle = (hackTimeMultiplier * skillFactor) + 3
 * TimePerGWHWCycle = (5 * skillFactor) + 3
 * TimePerGWHWCycle = skillFactor
 * TimePerGWHWCycle = (diffFactor * difficultyMult + baseDiff) / ((diffFactor * difficultMult + baseDiff) + baseSkill
 * TimePerGWHWCycle = (2.5 * difficultMult + 500) / ((2.5 * difficultMult + 500) + 50)
 * TimePerGWHWCycle = (2.5 * (MyServer.hackRequired * MyServer.securityMin) + 500) / ((2.5 * (MyServer.hackRequired * MyServer.securityMin) + 500) + 50)
 * 
 * TotalThreads = numGrowsToMax + numWeakensToMin + numHacksToSteal + numWeakensToMin2
 * TotalThreads = Math.ceil(Math.log(growth) / (Math.log(ajdGrowthRate) * player.mults.hacking_grow * serverGrowthPercentage * bitNodeMultipliers.ServerGrowthRate * coreBonus)) + numWeakensToMin + numHacksToSteal + numWeakensToMin2
 * TotalThreads = Math.ceil(Math.log(growth) / (Math.log(ajdGrowthRate) * 1 * serverGrowthPercentage * 1 * 1)) + numWeakensToMin + numHacksToSteal + numWeakensToMin2
 * TotalThreads = Math.ceil(Math.log(growth) / (Math.log(adjGrowthRate) * serverGrowthPercentage)) + numWeakensToMin + numHacksToSteal + numWeakensToMin2
 * 
 */
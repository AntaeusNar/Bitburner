import { calcGrowThreads, calcHackThreads, calculateHackingTime, getRoot, logger } from "./lib.general";


/**
 * @typedef {Object} threads
 * @param {number} PrimeWeakens
 * @param {number} PrimeGrows
 * @param {number} PrimeGrowWeakens
 * @param {number} PrimeTotal
 * @param {number} Hacks
 * @param {number} HackWeakens
 * @param {number} Grows
 * @param {number} GrowWeakens
 * @param {number} IdealTotal
 * @param {number} CompleteTotal
 */

/**
 * @typedef {Object} timings
 * @param {number} PrimeWeakensDelay
 * @param {number} PrimeGrowsDelay
 * @param {number} PrimeGrowWeakensDelay
 * @param {number} PrimeMaxTime
 * @param {number} HacksDelay
 * @param {number} HackWeakensDelay
 * @param {number} GrowsDelay
 * @param {number} GrowWeakensDelay
 * @param {number} IdealMaxTime
 */

export class MyServer {
    constructor(ns, hostname) {
        this.ns = ns;
        this.hostname = hostname;
        this._admin = false;
        this._hackable = false;
        this._maxRam = 0;
        this.minDifficulty = ns.getServerMinSecurityLevel(hostname);
        this.growthMultiplier = ns.getServerGrowth(hostname);
        this.requiredHackingSkill = ns.getServerRequiredHackingLevel(hostname);
        this.percent = -Infinity;
        this.moneyMax = hostname === 'home' ? 0 : ns.getServerMaxMoney(hostname);
        this.maxRam = hostname === 'home' ? ns.getServerMaxRam(hostname) - 32 : ns.getServerMaxRam(hostname);
        this.percent = .001;
        this.maxThreads = Infinity;
    }

    get currentDifficulty() { return this.ns.getServerSecurityLevel(this.hostname); }

    /**
     * @returns {boolean} true if the server is rooted
     */
    get hasAdminRights() {
        if (!this._admin) {
            if (this.hostname === 'home') { this._admin = true; }
            if (getRoot(this.ns, this.hostname)) { this._admin = true; }
        }
        return this._admin;
    }

    /**
     * @returns {boolean} true if the server can have hacking scripts ran against it and moneyMax > 0
     */
    get isHackable() {
        if (!this._hackable) {
            if (this.hostname === 'home' || !this.hasAdminRights || this.requiredHackingSkill > this.ns.getHackingLevel() || this.moneyMax == 0) { return false; }
            this._hackable = true;
        }
        return this._hackable;
    }

    /**
     * @returns {number} $/Sec(batch)/Thread(batch) @ target % if the server is Hackable and has money
     */
    get priority() {
        if (!this.isHackable) { return 0; }
        let _priority = (this.moneyMax * this.percent) / this.batchTime.IdealMaxTime / this.batchThreads.IdealTotal;
        if (isNaN(_priority) || _priority < 0) { _priority = 0; }
        return Math.floor(_priority * 100 + .5) / 100;
    }

    /**
     * Calculates the timing of threads of each type for a single batch in sec
     * @returns {timings}
     */
    get batchTime() {
        /** Each group of threads Pw, Pg, Pgw, H, Hw, G, Gw need to all hit 1 sec after another.
         * all weakens = hack * 4
         * all grows = hack * 3.2
         */
        let timings = {
            PrimeWeakensDelay: -Infinity,
            PrimeGrowsDelay: -Infinity,
            PrimeGrowWeakensDelay: -Infinity,
            PrimeMaxTime: -Infinity,
            HacksDelay: -Infinity,
            HackWeakensDelay: -Infinity,
            GrowsDelay: -Infinity,
            GrowWeakensDelay: -Infinity,
            IdealMaxTime: -Infinity,
        }


        let idealHackingTime = calculateHackingTime(this, this.ns.getPlayer(), true);
        let idealWeakensTime = idealHackingTime * 4;
        let idealGrowsTime = idealHackingTime * 3.2;

        if (!this.isPrimed) {
            let realHackingTime = calculateHackingTime(this, this.ns.getPlayer());
            let primeWeakensTime = realHackingTime * 4;
            let primeGrowsTime = realHackingTime * 3.2;
            timings.PrimeWeakensDelay = 0;
            timings.PrimeGrowsDelay = primeWeakensTime + 1 - primeGrowsTime;
            timings.PrimeGrowWeakensDelay = 2;
            timings.PrimeMaxTime = primeWeakensTime + 2;
            timings.HacksDelay = primeWeakensTime + 3 - idealHackingTime;
            timings.HackWeakensDelay = primeWeakensTime + 4 - idealWeakensTime;
            timings.GrowsDelay = primeWeakensTime + 5 - idealGrowsTime;
            timings.GrowWeakensDelay = primeWeakensTime + 6 - idealWeakensTime;
            timings.IdealMaxTime = idealWeakensTime + 3;
        } else {
            timings.PrimeWeakensDelay = 0;
            timings.PrimeGrowsDelay = 0;
            timings.PrimeGrowWeakensDelay = 0;
            timings.PrimeMaxTime = 0;
            timings.HacksDelay = idealWeakensTime - idealHackingTime - 1;
            timings.HackWeakensDelay = 0;
            timings.GrowsDelay = idealWeakensTime + 1 - idealGrowsTime;
            timings.GrowWeakensDelay = 2
            timings.IdealMaxTime = idealWeakensTime + 2;
        }
        return timings;
    }

    /**
     * Calculates the number of threads of each type for a single batch
     * @returns {threads}
     */
    get batchThreads() {
        let threads = {
            PrimeWeakens: 0,
            PrimeGrows: 0,
            PrimeGrowWeakens: 0,
            PrimeTotal: 0,
            Hacks: 0,
            HackWeakens: 0,
            Grows: 0,
            GrowWeakens: 0,
            IdealTotal: 0,
            CompleteTotal: 0,
        }

        if (!this.isPrimed) {
            threads.PrimeWeakens = Math.floor((this.currentDifficulty - this.minDifficulty) / .05 +.5) ;
            threads.PrimeGrows = Math.floor(calcGrowThreads(this, this.ns.getPlayer()) + .5);
            threads.PrimeGrowWeakens = Math.floor(threads.PrimeGrows * .002 / .05 + .5);
            threads.PrimeTotal = threads.PrimeWeakens + threads.PrimeGrows + threads.PrimeGrowWeakens;
        }
        threads.Hacks = Math.floor(calcHackThreads(this, this.ns.getPlayer(), true) +.5);
        threads.HackWeakens = Math.floor(threads.Hacks * .002 / .05 + .5);
        threads.Grows = Math.floor(calcGrowThreads(this, this.ns.getPlayer(), true) + .5);
        threads.GrowWeakens = Math.floor(threads.Grows * .002 / .05 + .5);
        threads.IdealTotal = threads.Hacks + threads.HackWeakens + threads.Grows + threads.GrowWeakens;
        threads.CompleteTotal = threads.PrimeTotal + threads.IdealTotal;

        return threads;
    }

    /**
     * Helper function to calculate the best % to target the server with.
     * increasing the number of hack threads dramatically increase the number of needed growth threads.
     * Therefore there is a sweet spot of min number of threads to get the most money based on the % of moneyMax
     * we are trying to steal.
     * @param {number} [maxThreads = Infinity]
     */
    calculateTargetPercentage(maxThreads = Infinity) {
        if (this.moneyMax == 0) { return; }
        let startingPercent = this.percent;
        this.maxThreads = maxThreads;

        let increasing = true;
        while (increasing) {
            let cP = this.percent;
            let current = this.priority;
            this.percent += .001;
            let increased = this.priority;
            if (increased <= current || this.percent >= 1 || this.batchThreads.IdealTotal >= this.maxThreads) {
                increasing = false;
                this.percent = cP;
            }
        }
        let decreasing = true;
        while (decreasing) {
            let cP = this.percent;
            let current = this.priority;
            this.percent -= .001;
            let decreased = this.priority;
            if (decreased <= current || this.percent <= 0) {
                decreasing = false;
                this.percent = cP;
            }
        }

        if (startingPercent != this.percent) {
            logger(this.ns, this.hostname + " started at " + startingPercent + ' and adjusted to ' + this.percent);
        }

    }
}
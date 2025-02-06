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

/**
 * @typedef {Object} DeploymentResults
 * @param {boolean} successful True if all Deployed
 * @param {number} deployedScripts how many scripts deployed
 * @param {number[]} pids array of pids created
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
        this.maxRam = hostname === 'home' ? ns.getServerMaxRam(hostname) - 16 : ns.getServerMaxRam(hostname);
        this.percent = .001;
        this.maxThreads = Infinity;
        this._isPrimedStr = false;
        this._isPrimedMoney = false;
    }

    get currentDifficulty() { return this.ns.getServerSecurityLevel(this.hostname); }
    get moneyCurrent() { return this.ns.getServerMoneyAvailable(this.hostname); }
    get availableRam() {
        let availableRam = this.hasAdminRights ? this.maxRam - this.ns.getServerUsedRam(this.hostname) : 0;
        return availableRam;
    }

    get isPrimed() {
        if (!this._isPrimedStr) {
            if (this.minDifficulty == this.currentDifficulty) {
                this._isPrimedStr == true;
            }
        }
        if (!this._isPrimedMoney) {
            if (this.moneyMax == this.moneyCurrent) {
                this._isPrimedMoney == true;
            }
        }
        if (this._isPrimedStr && this._isPrimedMoney) { return true; }
        return false;
    }

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

    hackSelf(drones, batchFiles, usableScripts, cycleBatch) {
        let weakenFile = batchFiles[0];
        let growFile = batchFiles[1];
        let hackFile = batchFiles[2];
        let maxScripts = usableScripts;
        let successful = true;
        let pids = [];
        let vectors = this.batchThreads;
        let delays = this.batchTime;
        let usableDrones = drones.filter(drone => drone.availableRam != 0);
        let localResults = {};

        //PrimeWeakens
        if (vectors.PrimeWeakens > 0 && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, weakenFile, this, vectors.PrimeWeakens, delays.PrimeWeakensDelay, 'PrimeWeakens ' +cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all Primary Weakens against ' + this.hostname, 0);
                successful = false;
                this._isPrimedStr = false;
            } else { this._isPrimedStr = true; successful = true; }
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);
        }

        //PrimeGrows
        if (vectors.PrimeGrows > 0 && successful && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, growFile, this, vectors.PrimeGrows, delays.PrimeGrowsDelay, cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all Primary Grows against ' + this.hostname, 0);
                successful = false;
                this._isPrimedMoney = false;
            } else { this._isPrimedMoney = true; successful = true; }
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);
        }

        //PrimeGrowWeakens
        if (vectors.PrimeGrowWeakens > 0 && successful && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, weakenFile, this, vectors.PrimeGrowWeakens, delays.PrimeGrowWeakensDelay, cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all Primary GrowWeakens against ' + this.hostname, 0);
                successful = false;
                this._isPrimedStr = false;
            } else { this._isPrimedStr = true; successful = true; }
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);
        }

        //Hacks
        if (vectors.Hacks > 0 && successful && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, hackFile, this, vectors.Hacks, delays.HacksDelay, cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all Hacks against ' + this.hostname, 0);
                successful = false;
            } else { this._isPrimedStr = false; this._isPrimedMoney = false; successful = true;}
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);
        }

        //HackWeakens
        if (vectors.HackWeakens > 0 && successful && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, weakenFile, this, vectors.HackWeakens, delays.HackWeakensDelay, cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all Hack Weakens against ' + this.hostname, 0);
                successful = false;
                this._isPrimedStr = false;
            } else { this._isPrimedStr = true; successful = true;}
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);
        }

        //Grows
        if (vectors.Grows > 0 && successful && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, growFile, this, vectors.Grows, delays.GrowsDelay, cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all Grows against ' + this.hostname, 0);
                successful = false;
                this._isPrimedMoney = false;
            } else { this._isPrimedMoney = true; this._isPrimedStr = false; successful = true;}
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);

        }

        //GrowWeakens
        if (vectors.GrowWeakens > 0 && successful && maxScripts > 0) {
            successful = false;
            localResults = macroDeploy(this.ns, usableDrones, weakenFile, this, vectors.GrowWeakens, delays.GrowWeakensDelay, cycleBatch);
            if (!localResults.successful) {
                logger(this.ns, 'WARNING: Could not deploy all GrowWeakens against ' + this.hostname, 0);
                successful = false;
                this._isPrimedStr = false;
            } else { this._isPrimedStr = true; successful = true;}
            maxScripts -= localResults.deployedScripts;
            pids.push( ...localResults.pids);
        }

        let deployedScripts = maxScripts - usableScripts
        let results = {
            successful: successful,
            deployedScripts: deployedScripts,
            pids: pids,
        }
        return results;
    }

    deployFiles(files) {
        if (this.hostname === 'home') { return; }
        if (!this.ns.scp(files, this.hostname, 'home')) {
            throw new Error('Failed to copy ' + JSON.stringify(files) + ' to ' + this.hostname);
        }
    }
}


/** deploys a single script on all drones against a single target until x threads have been reached
 * @param {NS} ns
 * @param {MyServer[]} drones array of MyServer class drones
 * @param {string} script filename
 * @param {MyServer} target target MyServer class
 * @param {number} threads # of threads to try to deploy
 * @param {number} waitTime delay before execution of script
 * @param {string} cycleBatch string to make script unique
 * @returns {DeploymentResults} results
 */
function macroDeploy(ns, drones, script, target, threads, waitTime, cycleBatch) {
    let neededRam = ns.getScriptRam(script);
    let successful = false;
    let deployedScripts = 0;
    let pids = [];
    drones.sort((a, b) => b.availableRam - a.availableRam);

    let i = 0;
    while (!successful && i < drones.length) {
        let currentDrone = drones[i];
        currentDrone.deployFiles(script);
        let currentAvailableThreads = Math.floor(currentDrone.availableRam/neededRam + .5);
        let deployableThreads = Math.min(threads, currentAvailableThreads);
        if (deployableThreads > 0) {
            let result = microDeploy(ns, currentDrone.hostname, target.hostname, script, deployableThreads, waitTime, cycleBatch);
            if (result > 0) {
                pids.push(result)
                threads -= deployableThreads;
                deployedScripts += 1;
                if (threads <= 0 ) {
                    successful = true;
                }
            }
        }
        i++;
    }
    let results = {
        successful: successful,
        deployedScripts: deployedScripts,
        pids: pids,
    }
    return results;
}

/** Deploys a single script on a single drone against a single target with x threads
 * @param {NS} ns
 * @param {string} drone drone.hostname
 * @param {string} target target.hostname
 * @param {string} script file name
 * @param {number} deployableThreads threads to deploy
 * @param {number} waitTime delay before execution of script
 * @param {string} cycleBatch string to make script unique
 * @returns {number} resulting PID
 */
function microDeploy(ns, drone, target, script, deployableThreads, waitTime, cycleBatch) {
    let result = ns.exec(script, drone, deployableThreads, target, waitTime, cycleBatch);
    if (!result) {
        throw new Error('Failed to deploy ' + script + ' on ' + drone + ' against ' + target)
    }
    return result;
}
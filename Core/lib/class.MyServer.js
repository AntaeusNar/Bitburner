import { calculateGrowTime, calculateHackingTime, calculateSingleBatchThreads, calculateWeakenTime, getRoot } from "./lib.general";
import { baseDelay } from "./options.general";

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
        this.percent = 'not set';
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
        let threads = this.batchThreads;
        let _priority = (this.moneyMax * this.percent) / this.batchTime.maxTime / threads.total;
        if (isNaN(_priority) || _priority < 0) { _priority = 0; }
        return _priority;
    }

    get batchTime() {
        if (!this.isHackable) { return 0; }
        let growTime = calculateGrowTime(this, this.ns.getPlayer(), true);
        let weakenTime = calculateWeakenTime(this, this.ns.getPlayer(), true);
        let hackTime = calculateHackingTime(this, this.ns.getPlayer(), true)
        let timing = {
            G: growTime,
            Wg: weakenTime + baseDelay,
            H: hackTime + baseDelay * 2,
            Wh: weakenTime + baseDelay * 3,
            maxTime: -Infinity
        }
        for (const key of Object.keys(timing)) {
            if (timing[key] > timing.maxTime) {
                timing.maxTime = timing[key]
            }
        }
        return timing;
    }

    get batchThreads() {
        if (!this.isHackable) { return null; }
        return calculateSingleBatchThreads(this, this.ns.getPlayer(), true);

    }
}
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
    }

    get currentDifficulty() { return this.ns.getServerSecurityLevel(this.hostname); }

    get hasAdminRights() {
        if (!this._admin) {
            if (this.hostname === 'home') { this._admin = true; }
            if (getRoot(this.ns, this.hostname)) { this._admin = true; }
        }
        return this._admin;
    }

    get isHackable() {
        if (!this._hackable) {
            if (this.hostname === 'home' || !this.hasAdminRights || this.requiredHackingSkill > this.ns.getHackingLevel()) { return false; }
            this._hackable = true;
        }
        return this._hackable;
    }

    get moneyMax() {
        if (this.ns.getServerMaxMoney(this.hostname) == 0) { return 0; }
        if (this.hostname === 'home') { return 0; }
        return this.ns.getServerMaxMoney(this.hostname);
    }

    get maxRam() {
        if (this._maxRam > 0) { return this._maxRam; }
        if (this.hostname === 'home') { this._maxRam = this.ns.getServerMaxRam(this.hostname) - 32; }
        if (this.hasAdminRights) { this._maxRam = this.ns.getServerMaxRam(this.hostname); }
        return this._maxRam;
    }

    /**
     * @returns {number} $/Sec(batch)/Thread(batch) @ target %
     */
    get priority() {
        if (this.moneyMax == 0) { return 0; }
        if (!this.hasAdminRights || !this.isHackable) { return 0}
        let threads = this.batchThreads;
        let _priority = (this.moneyMax * this.percent) / this.batchTime.maxTime / threads.total;
        if (isNaN(_priority) || _priority < 0) { _priority = 0; }
        return _priority;
    }

    get batchTime() {
        if (this.moneyMax == 0) { return 0; }
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
        if (this.moneyMax == 0 ) { return null; }
        return calculateSingleBatchThreads(this, this.ns.getPlayer(), true);

    }
}
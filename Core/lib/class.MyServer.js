import { getRoot } from "./lib.general";

export class MyServer {
    constructor(ns, hostname) {
        this.ns = ns;
        this.hostname = hostname;
        this._admin = false;
        this._maxRam = 0;
        this._moneyMax = 0;
    }

    get hasAdminRights() {
        if (!this._admin) {
            if (this.hostname === 'home') { this._admin = true; }
            if (getRoot(this.ns, this.hostname)) { this._admin = true; }
        }
        return this._admin;
    }

    get moneyMax() {
        if (this._moneyMax > 0) { return this._moneyMax; }
        if (this.ns.getServerMaxMoney(this.hostname) == 0) { return 0; }
        if (this.hostname === 'home') { return 0; }
        if (this.hasAdminRights && this.ns.getServerRequiredHackingLevel() <= this.ns.getHackingLevel()) { this._moneyMax = this.ns.getServerMaxMoney(this.hostname); }
        return this._moneyMax;
    }

    get maxRam() {
        if (this._maxRam > 0) { return this._maxRam; }
        if (this.hostname === 'home') { this._maxRam = this.ns.getServerMaxRam(this.hostname) - 32; }
        if (this.hasAdminRights) { this._maxRam = this.ns.getServerMaxRam(this.hostname); }
        return this._maxRam;
    }
}
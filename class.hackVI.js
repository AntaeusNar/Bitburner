/** The overall Hack Virtual Intelligence (VI) */

import { Logger, maxNeededRam, recServerScan } from "./lib.misc";

let logger = new Logger(ns, 7);

export class HackVI {
    constructor(ns) {
        this.ns = ns;
        this._init();
        return this;
    }

    get files() {
        return ['lt-weaken.js', 'lt-grow.js', 'lt-hack.js'];
    }

    get neededRam() {
        return maxNeededRam(this.ns, this.files);
    }

    get serverList() {
        return recServerScan(this.ns);
    }
}
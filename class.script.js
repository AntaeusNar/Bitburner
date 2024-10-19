/** Class describing a basic script */
export class Script {
    /** Creates a Script
     * @param {ns} ns
     * @param {number} pid
     */
    constructor(ns, pid) {
        this.ns = ns;
        this.pid = pid;
        this.threads = 0;
    }

    get isActive() {
        let result = this.ns.getRunningScript(this.pid);
        if (result) {result = true} else {result = false}
        return result;
      }

      get threads() {
        return this.ns.getRunningScript(this.pid).threads;
      }

      toJSON() {
        return {
          pid: this.pid,
          threads: this.threads,
          isActive: this.isActive,
        }
      }
}
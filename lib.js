/** Basic Server Class */
class BasicServer {

  /** Creates the most basic server object
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    this.ns = ns;
    this.hostname = hostname;
    this.ratio = null;
    this.isDrone = false;
    this.isTarget = false;
    this._hasAdminRights = false;
    //maxRam and moneyMax with handling for home
    if (this.hostname == 'home') {
      this.maxRam = this.ns.getServerMaxRam(this.hostname) - 32;
      this.moneyMax = 0;
    } else {
      this.maxRam = this.ns.getServerMaxRam(this.hostname);
      this.moneyMax = this.ns.getServerMaxMoney(this.hostname);
    }
  }
}// end of BasicServer class

/** Drone Server Class */
class DroneServer extends BasicServer {
  /** Creates a Drone Server
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
    //since TargetServer extends DroneServer there is a small chance that a valid
    //TargetServer is NOT infact a good drone, so we will still need the flags
    if (this.maxRam > 0) {
      this.isDrone = true;
    }
  }

  //Getter for hasAdminRights (will store value, and check using can)
  get hasAdminRights() {
    //first check
    if (!this._hasAdminRights) {
      this._hasAdminRights = this.ns.hasRootAccess(this.ns, this.hostname)
    }
    //second check with attempt to hack
    if (!this._hasAdminRights) {
      this._hasAdminRights = getRoot(ns, this.hostname);
    }
    return this._hasAdminRights;
  }
}// end of DroneServer class

/** Target Server Class */
class TargetServer extends BasicServer {
  //some private class Properties
  #_takePercent

  /** Create a Target Server
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
    this.isTarget = true;
    this.#_takePercent = Math.max(.001, this.percentPerSingleHack, this.formPercentPerSingleHack);
    this.isPrimedStr = false;
    this.isPrimedMoney = false;
    this.requiredHackingSkill = this.ns.getServerRequiredHackingLevel(this.hostname);
    this.minDifficulty = this.ns.getServerMinSecurityLevel(this.hostname);
    this.idealServerState = {
      hackDifficulty: this.minDifficulty,
      requiredHackingSkill: this.requiredHackingSkill,
    }
  }

  //current weakenTime in milliseconds
  get weakenTime() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel()) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    return this.ns.getWeakenTime(this.hostname);
  }

  //Best case weakenTime in milliseconds
  get formWeakenTime() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel()) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let result = null;
    if (can(this.ns, 'Formulas.exe')) {
      result = this.ns.formulas.hacking.weakenTime(this.idealServerState, this.ns.getPlayer());
    }
    return result;
  }

  //Best case % of server a single hack() thread can take as a decimal to 6 digits
  get PercentPerSingleHack() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel()) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let result = null;
    if (can(this.ns, 'Formulas.exe')) {
      result =
        Math.round(this.ns.formulas.hacking.hackPercent(this.idealServerState, this.ns.getPlayer()) *
        this.ns.formulas.hacking.hackChance(this.idealServerState, this.ns.getPlayer())*1000000)/1000000;
    } else {
      result = Math.round(this.ns.hackAnalyze(this.hostname)*this.ns.hackAnalyzeChance(this.hostname)*1000000)/1000000;
    }
    return result;
  }


  //batchTime in milliseconds
  get batchTime() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel()) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let result = null;
    if (this.formWeakenTime) {
      result = (this.formWeakenTime + baseDelay*5);
    } else {
      result = (this.weakenTime + baseDelay*5);
    }
    return result;
  }

  //Number of batches in a cycle
  get batchesPerCycle() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel()) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    return Math.floor(this.batchTime/baseDelay);
  }

  //the current takePercent
  get takePercent() {
    return Math.max(this.#_takePercent, this.percentPerSingleHack);
  }

  //sets the takePercent
  set takePercent(take) {
    this.#_takePercent = Math.max(this.#_takePercent, this.percentPerSingleHack);
  }

  //Ratio calculation -> thoughts
  //The ratio should always be best possible
  //The ratio should be in $ per Thread per Sec
  get ratio() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel()) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let targetTake = this.moneyMax*this.takePercent;
    let vectorsPerBatch = evalVectors(this.ns, this);
    return Math.floor(targetTake/vectorsPerBatch/batchTime/1000); // $/thread/Sec
  }
}//end of Target Server class

/** Server Factory when given a hostname, will make a server object that is either basic, drone, or target */
class ServerFactory {

  /** creates the object
    * @param {NS} ns
    * @param {string} hostname
    */
  create = (ns, hostname) => {
    if (typeof(hostname) !== 'string' || !ns.serverExists(hostname)) {
      throw new Error('Hostname for server must be a string and a valid hostname.')
    }

    let server;

    if (ns.getServerMaxMoney(hostname) > 0 && hostname != 'home') {
      server = new TargetServer(ns, hostname);
    } else if (ns.getServerMaxRam(hostname) > 0) {
      server = new DroneServer(ns, hostname);
    } else {
      server = new BasicServer(ns, hostname);
    }
    return server;
  }

}// end of server factory

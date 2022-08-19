import {can, getRoot, evalVectors, logger} from 'lib.js';
import {baseDelay} from 'options.js';

/** Basic Server Class */
export class BasicServer {

  /** Creates the most basic server object
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    this.ns = ns;
    this.hostname = hostname;
    this.isDrone = false;
    this.isTarget = false;
    this._hasAdminRights = false;
    this.numberOfPortsRequired = this.ns.getServerNumPortsRequired(this.hostname);
    //maxRam and moneyMax with handling for home
    if (this.hostname == 'home') {
      this.maxRam = this.ns.getServerMaxRam(this.hostname) - 32;
      this.moneyMax = 0;
    } else {
      this.maxRam = this.ns.getServerMaxRam(this.hostname);
      this.moneyMax = this.ns.getServerMaxMoney(this.hostname);
    }
    this.hasAdminRights; //This is....bad, but i need to check this getter
  }

  //Getter for hasAdminRights (will store value, and check using can)
  get hasAdminRights() {
    //first check
    if (!this._hasAdminRights) {
      this._hasAdminRights = this.ns.hasRootAccess(this.hostname)
    }
    //second check with attempt to hack
    if (!this._hasAdminRights) {
      this._hasAdminRights = getRoot(this.ns, this);
    }
    return this._hasAdminRights;
  }

  toJSON() {
    return {
      hostname: this.hostname,
    }
  }
}// end of BasicServer class

/** Drone Server Class */
export class DroneServer extends BasicServer {
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

  toJSON() {
    return {
      hostname: this.hostname,
      hasAdminRights: this.hasAdminRights,
      isDrone: this.isDrone,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
    }
  }

}// end of DroneServer class

/** Target Server Class */
export class TargetServer extends DroneServer {
  //some private class Properties
  #_takePercent
  #_isPrimedStr
  #_isPrimedMoney

  /** Create a Target Server
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
    this.isTarget = true;
    this.#_takePercent = .001;
    this.#_isPrimedStr = false;
    this.#_isPrimedMoney = false;
    this.requiredHackingSkill = this.ns.getServerRequiredHackingLevel(this.hostname);
    this.minDifficulty = this.ns.getServerMinSecurityLevel(this.hostname);
    this.idealServerState = {
      hackDifficulty: this.minDifficulty,
      requiredHackingSkill: this.requiredHackingSkill,
    }
  }

  //gets current available money
  get moneyAvailable() {
    return this.ns.getServerMoneyAvailable(this.hostname);
  }

  //gets/checks if target is/projected to be at min security
  get isPrimedStr() {
    if (this.ns.getServerSecurityLevel(this.hostname) == this.minDifficulty) {
      this.#_isPrimedStr = true;
    }
    return this.#_isPrimedStr;
  }

  //sets isPrimedStr (should only come from evalVectors and only when used to realworld delpoyment)
  // TODO: change this to be only used on completed deployment
  set isPrimedStr(boolean) {
    this.#_isPrimedStr = boolean;
  }

  //gets/checks if target is/projected to be at max money
  get isPrimedMoney() {
    if (this.moneyMax == this.moneyAvailable) {
      this.#_isPrimedMoney = true;
    }
    return this.#_isPrimedMoney;
  }

  //sets isPrimedMoney (should only come from evalVectors and only when used to realworld deploment)
  // TODO: change this to only be used on completed deplayment
  set isPrimedMoney(boolean) {
    this.#_isPrimedMoney = boolean;
  }

  //current weakenTime in milliseconds
  get weakenTime() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    return this.ns.getWeakenTime(this.hostname);
  }

  //Best case weakenTime in milliseconds
  get formWeakenTime() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let result = null;
    if (can(this.ns, 'Formulas.exe')) {
      result = this.ns.formulas.hacking.weakenTime(this.idealServerState, this.ns.getPlayer());
    }
    return result;
  }

  //Best case % of server a single hack() thread can take as a decimal to 6 digits
  get percentPerSingleHack() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
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
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
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
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    return Math.floor(this.batchTime/baseDelay);
  }

  //the current takePercent
  get takePercent() {
    return Math.max(this.#_takePercent, this.percentPerSingleHack);
  }

  //sets the takePercent
  set takePercent(take) {
    //sets takePercent to a decimal between max 1 and min this.percentPerSingleHack
    this.#_takePercent = Math.max(Math.min(1, take), this.percentPerSingleHack);
  }

  //Generates the number of vectors in a single batch
  get vectorsPerBatch() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    return evalVectors(this.ns, this).totalVectors;
  }

  //should give estmated $/Sec
  get estReturn() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let moneyPerCycle = this.moneyMax*this.takePercent*this.batchesPerCycle;
    let time = Math.round((this.batchTime + (this.batchesPerCycle*baseDelay))/1000);
    return moneyPerCycle/time
  }

  //Ratio calculation -> thoughts
  //The ratio should always be best possible
  //The ratio should be in $ per Thread per Sec
  //Additionally this calculation should use this.batchTime when doing inital ratioing,
  //but should use the first(best/primary) target's batchTime when doing a comparision
  //This is because the first target will dictate the speed of other targets deployments
  //So the return will be agjusted to match.
  ratio() {
    if (this.requiredHackingSkill > this.ns.getHackingLevel() || !this.hasAdminRights) {return null;} //if you call this, and your hack isn't high enough, you get nothing
    let targetTake = this.moneyMax*this.takePercent;
    let ratio = Math.floor(targetTake/this.vectorsPerBatch/(this.batchTime/1000)); // $/thread/Sec
    if (isNaN(ratio) || ratio == null || ratio == 0) {
      throw new Error('Error: ' + this.hostname + ' has an invalid ratio!')
    }
    return ratio;
  }

  toJSON() {
    return {
      hostname: this.hostname,
      hasAdminRights: this.hasAdminRights,
      isDrone: this.isDrone,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
      isTarget: this.isTarget,
      isPrimedStr: this.isPrimedStr,
      isPrimedMoney: this.isPrimedMoney,
      requiredHackingSkill: this.requiredHackingSkill,
      minDifficulty: this.minDifficulty,
      ratio: this.ratio(),
      estReturn: this.estReturn,
      takePercent: this.takePercent,
      percentPerSingleHack: this.percentPerSingleHack,
      batchTime: this.batchTime,
      vectorsPerBatch: this.vectorsPerBatch,
      batchesPerCycle: this.batchesPerCycle,
    }
  }

  /** This static function will adjust the takePercent of an array of Server class objects
    * until array[0].ratio ~= array[1].ratio recusivly.
    * Because increasing the takePercent is a non-linar increase in the number of needed Threads
    * this function will loop the increase
    * In order to prevent a.ratio < b.ratio this will need to stepdown the take after increasing
    * this should prevent overshooting and messingup prioritization.
    * This function will also keep the adjustments under the maxThread limit
    * This will prevent over commitment vs a single target
    * Additionally, the number of vectors per cycle will be caclulated per
    * the number of batches per cycle of the primary target.
    * This ensures that if b can be hit faster then a (lower weakentime)
    * there are not unusable threads reserved as used.
    * @param {NS} ns
    * @param {array} targets - array of Server class objects
    * @param {number} maxThreads
    * @param {number} [numBatchesPerCycle=0] - the control speed
    * @param {number} [reserveThreads=0] - number of reserved threads
    * @param {number} [indexOfTarget=0] - the current target
    */
  static async adjustTake(ns, targets, maxThreads, numBatchesPerCycle = 0, reserveThreads = 0, indexOfTarget = 0) {
    let i = indexOfTarget;
    let tempVectorsPerCycle = 0
    if (i == 0) {
      numBatchesPerCycle = targets[0].batchesPerCycle;
      reserveThreads = numBatchesPerCycle*targets[0].vectorsPerBatch;
    }
    let oldTake = targets[i].takePercent;

    if (indexOfTarget+1 == targets.length) { //handling for last server in target list
      logger(ns, "INFO: on last server " + targets[i].hostname);

      while (reserveThreads < maxThreads &&
        targets[i].takePercent < .999) {
          let oldThreads = numBatchesPerCycle*targets[i].vectorsPerBatch;
          let takeIncrease = Math.max(targets[i].percentPerSingleHack, .001);
          targets[i].takePercent = Math.round((targets[i].takePercent + takeIncrease)*1000)/1000;
          let newThreads = numBatchesPerCycle*targets[i].vectorsPerBatch;
          reserveThreads = reserveThreads + (newThreads - oldThreads);
          await ns.sleep(1);
      }

    } else { //handling for everything else
      //// TEMP: Error for testing
      if (targets[i].ratio() < targets[i+1].ratio()) {
        throw new Error(targets[i].hostname + ' has a worse ratio then ' + targets[i+1].hostname);
      }

      //Run a loop to increase the take, and the ratio while
      //there are threads available, a next target, ratio is greater the the Next
      //and the take is less then 99%
      while (reserveThreads < maxThreads &&
        targets[i].ratio() > targets[i+1].ratio() &&
        targets[i].takePercent < .999) {
          let oldThreads = numBatchesPerCycle*targets[i].vectorsPerBatch;
          let takeIncrease = Math.max(targets[i].percentPerSingleHack, .001);
          targets[i].takePercent = Math.round((targets[i].takePercent + takeIncrease)*1000)/1000;
          let newThreads = numBatchesPerCycle*targets[i].vectorsPerBatch;
          reserveThreads = reserveThreads + (newThreads - oldThreads);
          await ns.sleep(1);
      }
    }

    if (oldTake != targets[i].takePercent) {
      logger(ns, 'Increased ' + targets[i].hostname + ' from  ' + oldTake*100 + '% to ' + targets[i].takePercent*100 + '% threads at ' + reserveThreads + '/' + maxThreads);
    } else {
      logger(ns, 'No adjustment mad to ' + targets[i].hostname);
    }

    if (reserveThreads >= maxThreads) {
      logger(ns, 'INFO: max threads hit, stopping take increase calc.');
    } else if (indexOfTarget >= targets.length || !targets[i+1].hasAdminRights) {
      logger(ns, 'INFO: hit last available target, but with available threads. Looping.');
      indexOfTarget = 0;
      await TargetServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reserveThreads, indexOfTarget)
    } else {
      logger(ns, 'INFO: Calcuclating take for next target.');
      indexOfTarget++;
      await TargetServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reserveThreads, indexOfTarget);
    }
  }//end of static adjustTake

}//end of Target Server class

/** Server Factory when given a hostname, will make a server object that is either basic, drone, or target */
export class ServerFactory {

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

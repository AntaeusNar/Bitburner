import {can, getRoot, realVectors, logger, evalVectorsPerBatch, evalWeakenTime, evalPercentTakePerHack, truncateNumber} from 'lib.js';
import {baseDelay, maxScripts} from 'options.js';

/** InactiveDrone server class */
export class InactiveDrone {

  /** Creates an inactive drone
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    this.numberOfPortsRequired = ns.getServerNumPortsRequired(hostname);
    this.threads = 0;
    if (hostname == 'home') {
      this.maxRam = ns.getServerMaxRam(hostname) - 32;
    } else {
      this.maxRam = ns.getServerMaxRam(hostname);
    }
  }//end of constructor

  //calculates the number of threads the server can host
  numberOfThreads(neededRam) {
    this.threads = truncateNumber(this.maxRam/neededRam, 0, 'floor');
  }

  init(neededRam) {
    logger(this.ns, 'Initialized InactiveDrone ' + this.hostname, 0);
    this.numberOfThreads(neededRam);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
      threads: this.threads,
    }
  }

}//end of InactiveDrone

/** Drone server class */
export class DroneServer extends InactiveDrone {

  /** Creates an active drone
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
  }

  get ramUsed() {
    return this.ns.getServerUsedRam(this.hostname);
  }

  get ramAvailable() {
    return this.maxRam - this.ramUsed;
  }

  init(neededRam) {
    logger(this.ns, 'Initialized DroneServer ' + this.hostname, 0);
    this.numberOfThreads(neededRam);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
      threads: this.threads,
      ramAvailable: this.ramAvailable,
    }
  }
}// end of Drone

/** InactiveTarget server class */
export class InactiveTarget {

  /** Creates a InactiveTarget
    * @param {ns} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    if (hostname == 'home') {throw new Error('Home is not a valid option for a target.')}
    this.moneyMax = ns.getServerMaxMoney(hostname);
    this.requiredHackingSkill = ns.getServerRequiredHackingLevel(hostname);
    this.minDifficulty = ns.getServerMinSecurityLevel(hostname);
    this._isHackable = false;
    this._takePercent = .001;
  }

  get isHackable() {
    if (!this._isHackable) {
      if (this.hasAdminRights && this.requiredHackingSkill <= this.ns.getHackingLevel()){
        this._isHackable = true;
      }
    }
    return this._isHackable;
  }

  //EVAL ONLY: returns best case.
  get percentPerSingleHack() {
    return truncateNumber(evalPercentTakePerHack(this.ns, this, this.ns.getPlayer()));
  }

  //EVAL ONLY: returns best case.
  get idealWeakenTime() {
    return evalWeakenTime(this, this.ns.getPlayer());
  }

  //EVAL ONLY: returns best case.
  get idealVectorsPerBatch() {
    let realTake = this._takePercent;
    this._takePercent = this.percentPerSingleHack;
    let result = evalVectorsPerBatch(this.ns, this, this.ns.getPlayer());
    this._takePercent = realTake;
    return result;
  }

  //EVAL ONLY: returns best case.
  get batchesPerCycle() {
    return this.idealWeakenTime + (baseDelay*3/1000)/baseDelay;
  }

  get takePercent() {
    return Math.min(1,truncateNumber(this._takePercent));
  }

  set takePercent(take) {
    if (take > 0) {
      this._takePercent += Math.max(take, this.percentPerSingleHack);
    } else {
      this._takePercent -= Math.min(take, this.percentPerSingleHack);
    }
  }

  get basePriority() {
    //$/threads/sec at lowest take and ideal conditions
    return truncateNumber(this.moneyMax*this.percentPerSingleHack/this.idealVectorsPerBatch/this.idealWeakenTime);
  }

  init() {
    logger(this.ns, 'Initialized InactiveTarget ' + this.hostname, 0);
    this.isHackable;
    this._takePercent = this.percentPerSingleHack;
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      isHackable: this.isHackable,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax,
      percentPerSingleHack: this.percentPerSingleHack,
      evalWeakenTime: this.evalWeakenTime,
      takePercent: this.takePercent,
      basePriority: this.basePriority,
      idealVectorsPerBatch: this.idealVectorsPerBatch,
    }
  }

}//end of InactiveTarget

/** Active Target server class */
export class TargetServer extends InactiveTarget {

  /** Creates a Target server
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
  }

  init() {
    logger(this.ns, 'Initialized TargetServer ' + this.hostname, 0);
    this.isHackable;
    this._takePercent = this.percentPerSingleHack;
    this.betterThanNext = 1;
    this.betterThanLast = 1;
  }

  //returns ideal vectors at actual take
  get actualVectorsPerBatch() {
    return evalVectorsPerBatch(this.ns, this, this.ns.getPlayer());
  }

  //$/threads/sec at take and ideal conditions
  get adjustedPriority() {
    return truncateNumber(this.moneyMax*this.takePercent/this.idealVectorsPerBatch/this.idealWeakenTime);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      isHackable: this.isHackable,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax,
      percentPerSingleHack: this.percentPerSingleHack,
      evalWeakenTime: this.evalWeakenTime,
      takePercent: this.takePercent,
      basePriority: this.basePriority,
      idealVectorsPerBatch: this.idealVectorsPerBatch,
      betterThanNext: this.betterThanNext,
      betterThanLast: this.betterThanLast,
      adjustedPriority: this.adjustedPriority,
    }
  }

  /** Calculates how much better each target is the the target with the next lowest basePriority and the Last
    *@param {array} targets - array of TargetServer Objects sorted buy basePriority, decending
    */
  static betterThanNextLast(targets) {
    for (let i = 0; i+1 < targets.length; i++) {
      targets[i].betterThanNext = truncateNumber(targets[i].basePriority/targets[i+1].basePriority);
      targets[i].betterThanLast = truncateNumber(targets[i].basePriority/targets[targets.length-1].basePriority);
    }
  }//end of betterThanNextLast

  /** This static function will adjust the take % of an array of TargetServer class objects
    * until array[i].adjustedPriority ~= array[i+1].adjustedPriority recursivly.
    * because the math to do this is very complexe, this function will loop and test.
    * This function will stay below the sounted maximum threads and below the max number of scripts
    * listed in options.js
    * This should focus efforts on the best $/thread/sec targets and limit system crashes
    * due to realworld memory limits
    * @param {NS} ns
    * @param {array} targets
    * @param {number} maxThreads
    * @param {number} [numBatchesPerCycle=0] - the control speed
    * @param {number} [reservedThreads=0] - the number of allocated threads
    * @param {number} [reservedScripts=0] - the number of allocated scripts 4 per batch
    * @param {number} [indexOfTarget=0] - the current target index in array of targets
    * @param {boolean} [firstRun=true] - if this is the first time running
    */
  static async adjustTake(ns, targets, maxThreads, numBatchesPerCycle = 0, reservedThreads = 0, reservedScripts = 0, indexOfTarget = 0 , firstRun = true) {
    //Setup
    let i = indexOfTarget;
    let tempVectorsPerCycle = 0;
    //first run only
    if (i == 0 && firstRun) {
      numBatchesPerCycle = targets[0].batchesPerCycle;
      reservedThreads = numBatchesPerCycle*targets[0].actualVectorsPerBatch;
    }
    if (firstRun) {
      reservedScripts += numBatchesPerCycle*4;
    }
    let oldTake = targets[i].takePercent;

    if (i + 1 == targets.length) { //handling for last server in arrray
      logger(ns, 'INFO: Last Server ' + targets[i].hostname);

      while (reservedThreads < maxThreads &&
        targets[i].takePercent < .999 &&
        reservedScripts < maxScripts) {
          let oldThreads = numBatchesPerCycle*targets[i].actualVectorsPerBatch;
          targets[i].takePercent = .001;
          let newThreads = numBatchesPerCycle*targets[i].actualVectorsPerBatch;
          reservedThreads = reservedThreads + (newThreads - oldThreads);
          await ns.sleep(1)
        }
    } else { //handling for everything else
      /** Loop to incease the take % while
        * there scripts available, threads available, the take % is less then 99%
        * and the adjustedPriority of a is less then b.
        */
      // TODO: in late bitnode progression there maybe more threads available but no more scripts
        //need to figureout the control structucres needed to max thread usage while under script usage
      while (reservedThreads < maxThreads &&
        targets[i].takePercent < .999 &&
        reservedScripts < maxScripts &&
        targets[i].adjustedPriority > targets[i+1].adjustedPriority) {
          let oldThreads = numBatchesPerCycle*targets[i].actualVectorsPerBatch;
          targets[i].takePercent = .001;
          let newThreads = numBatchesPerCycle*targets[i].actualVectorsPerBatch;
          reservedThreads = reservedThreads + (newThreads - oldThreads);
          await ns.sleep(1)
      }
    }

    // TODO: adjust take % back down if we are over threads after running

    //Status update on adjustments
    if (oldTake < targets[i].takePercent) {
      logger(ns, 'Increased ' + targets[i].hostname + ' from  ' + oldTake*100 + '% to ' + targets[i].takePercent*100 + '% threads at ' + reservedThreads + '/' + maxThreads);
    } else {
      logger(ns, 'No adjustment made to ' + targets[i].hostname);
    }

    //What next control
    if (reservedThreads >= maxThreads) {//Stop when out of Threads
      logger(ns, 'INFO: Max Threads limit reached, stopping take increase calc.');
    } else if (reservedScripts >= maxScripts) {//Stop when out of Scripts
      logger(ns, 'INFO: Max Scripts limit reached, stopping take increase calc');
    } else if (indexOfTarget != 0 && oldTake < targets[i].takePercent) { //Recure up if we adjusted the take and not on the best target
      logger(ns, 'INFO: adjusted take, check previous Target.');
      indexOfTarget--;
      await TargetServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reservedThreads, reservedScripts, indexOfTarget, false);
    } else if (indexOfTarget >= targets.length) { //Stop when finished with last target fully adjusted and all others readjusted
      logger(ns, 'WARNING: Finished last target, but should only reach this if there are available threads and scripts to still use.');
    } else { //if we still have threads, scripts, and targets, and have loop up and back to here, check the next one
      logger(ns, 'INFO: Calculating take for next Target.');
      indexOfTarget++;
      await TargetServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reservedThreads, reservedScripts, indexOfTarget);
    }
  }// end of adjustTake

}// end of active Target Class

/** Server Factory: given a hostname, and server type will create the server*/
export class ServerFactory {

  /** creates the servers
    * @param {NS} ns
    * @param {string} hostname
    * @param {string} serverType
    * @param {number} [neededRam=0] - ram per thread
    */
  create = (ns, hostname, serverType, neededRam=0) => {
    //Check for valid hostname
    if (typeof(hostname) !== 'string' || !ns.serverExists(hostname)) {
      throw new Error(hostname + ' is not a valid string or a valid hostname.');
    }
    //check for valid serverType
    if (!serverType || typeof(serverType) != 'string' ||
      !(serverType == 'Drone' || serverType == 'Target' || serverType == 'InactiveDrone' || serverType == 'InactiveTarget')) {
        throw new Error('Not a valid server type.')
    }

    let server;

    if (serverType == 'Target') {
      server = new TargetServer(ns, hostname);
    } else if (serverType == 'InactiveTarget') {
      server = new InactiveTarget(ns, hostname);
    } else if (serverType == 'Drone') {
      server = new DroneServer(ns, hostname);
    } else if (serverType == 'InactiveDrone') {
      server = new InactiveDrone(ns, hostname);
    }

    /** Common to all properties */
    server.hostname = hostname;
    server.serverType = serverType;
    server.ns = ns;
    //hasAdminRights
    server._hasAdminRights = false;
    const hasAdminRightsPattern = {
      get() {
        if (!this._hasAdminRights) {
          this._hasAdminRights = this.ns.hasRootAccess(this.hostname);
        }
        if (!this._hasAdminRights) {
          this._hasAdminRights = getRoot(this.ns, this.hostname);
        }
        return this._hasAdminRights;
      }
    }
    Object.defineProperty(server, 'hasAdminRights', hasAdminRightsPattern);

    if (server.serverType == 'InactiveDrone' || server.serverType == 'Drone') {
      server.init(neededRam);
    } else {
      server.init();
    }

    return server;
  }//end of create
}//end of server Factory

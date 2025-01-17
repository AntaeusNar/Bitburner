import {getRoot, realVectors, logger, evalVectorsPerBatch, evalWeakenTime, evalPercentTakePerHack, truncateNumber} from './lib.js';

//import {can, fileDump} from './lib.js;
import {baseDelay, maxScripts} from './options.js';

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

  //gets current available money
  get moneyAvailable() {
    return this.ns.getServerMoneyAvailable(this.hostname);
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
    return truncateNumber(evalPercentTakePerHack(this.ns, this, this.ns.getPlayer()), 7);
  }

  //EVAL ONLY: returns best case in sec.
  get idealWeakenTime() {
    return evalWeakenTime(this, this.ns.getPlayer());
  }

  //EVAL ONLY: returns best case at lowest take.
  get idealVectorsPerBatch() {
    let realTake = this._takePercent;
    this._takePercent = this.percentPerSingleHack;
    let result = evalVectorsPerBatch(this.ns, this, this.ns.getPlayer());
    this._takePercent = realTake;
    return result;
  }

  //EVAL ONLY: returns best case.
  get batchesPerCycle() {
    return truncateNumber(this.batchTime/baseDelay, 0, 'floor');
  }

  get takePercent() {
    return Math.min(1,truncateNumber(this._takePercent, 7));
  }

  set takePercent(take) {
    if (take > 0) {
      this._takePercent += Math.max(take, this.percentPerSingleHack);
    } else {
      this._takePercent -= Math.min(take, this.percentPerSingleHack);
    }
  }

  //time in milliseconds
  get batchTime() {
    return truncateNumber(this.idealWeakenTime*1000+baseDelay*5, 0, 'ceil');
  }

  get cycleThreads() {
    return truncateNumber(this.batchesPerCycle*this.idealVectorsPerBatch, 0, 'ceil');
  }

  //$/threads/sec/batch at lowest take and ideal conditions
  get basePriority() {

    return truncateNumber((this.moneyMax*this.percentPerSingleHack)/this.idealVectorsPerBatch/(this.batchTime/1000));
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
      basePriority: this.basePriority,
      percentPerSingleHack: this.percentPerSingleHack,
      idealWeakenTime: this.idealWeakenTime,
      takePercent: this.takePercent,
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
    this._isPrimedStr = false;
    this._isPrimedMoney = false;

  }

  //gets/checks if target is/projected to be at min security
  get isPrimedStr() {
    if (this.ns.getServerSecurityLevel(this.hostname) == this.minDifficulty) {
      this._isPrimedStr = true;
    }
    return this._isPrimedStr;
  }

  //sets isPrimedStr (should only come from realVectors and only when used to realworld delpoyment)
  set isPrimedStr(boolean) {
    this._isPrimedStr = boolean;
  }

  //gets/checks if target is/projected to be at max money
  get isPrimedMoney() {
    if (this.moneyMax == this.moneyAvailable) {
      this._isPrimedMoney = true;
    }
    return this._isPrimedMoney;
  }

  //sets isPrimedMoney (should only come from realVectors and only when used to realworld deploment)
  set isPrimedMoney(boolean) {
    this._isPrimedMoney = boolean;
  }

  //returns ideal vectors at actual take
  get actualVectorsPerBatch() {
    return evalVectorsPerBatch(this.ns, this, this.ns.getPlayer());
  }

  //$/threads/sec/batch at take and ideal conditions
  get adjustedPriority() {
    return truncateNumber((this.moneyMax*this.takePercent)/this.actualVectorsPerBatch/(this.batchTime/1000));
  }

  init() {
    logger(this.ns, 'Initialized TargetServer ' + this.hostname, 0);
    this.isHackable;
    this._takePercent = this.percentPerSingleHack;
    this.betterThanNext = 1;
    this.betterThanLast = 1;
    this.isPrimedStr;
    this.isPrimedMoney;
  }

  realVectorsPerBatch(maxThreads) {
    return realVectors(this.ns, this, maxThreads);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      adjustedPriority: this.adjustedPriority,
      basePriority: this.basePriority,
      percentPerSingleHack: this.percentPerSingleHack,
      takePercent: this.takePercent,
      batchTime: this.batchTime,
      idealVectorsPerBatch: this.idealVectorsPerBatch,
      realVectorsPerBatch: this.realVectorsPerBatch(10000).totalVectors,
      batchesPerCycle: this.batchesPerCycle,
      cycleThreads: this.cycleThreads,
      betterThanNext: this.betterThanNext,
      betterThanLast: this.betterThanLast,
      isPrimedStr: this.isPrimedStr,
      isPrimedMoney: this.isPrimedMoney,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      isHackable: this.isHackable,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax,
    }
  }

  /** Calculates how much better each target is the the target with the next lowest basePriority and the Last
    *@param {array} targets - array of TargetServer Objects sorted buy basePriority, decending
    */
  static betterThanNextLast(targets) {
    for (let i = 0; i+1 < targets.length; i++) {
      targets[i].betterThanNext = truncateNumber(targets[i].basePriority/Math.max(targets[i+1].basePriority, .001));
      targets[i].betterThanLast = truncateNumber(targets[i].basePriority/Math.max(targets[targets.length-1].basePriority, .001));
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
        targets[i].takePercent < 1 - targets[i].percentPerSingleHack &&
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
        targets[i].takePercent < 1 - targets[i].percentPerSingleHack &&
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
      logger(ns, 'Increased ' + targets[i].hostname + ' from  ' + oldTake*100 + '% to ' + targets[i].takePercent*100 + '%.  Threads at ' + reservedThreads + '/' + maxThreads);
    } else {
      logger(ns, 'No adjustment made to ' + targets[i].hostname);
    }

    //What next control
    if (reservedThreads >= maxThreads) {//Stop when out of Threads
      logger(ns, 'INFO: Max Threads limit reached, stopping take increase calc.');
    } else if (reservedScripts >= maxScripts) {//Stop when out of Scripts
      logger(ns, 'INFO: Max Scripts limit reached, stopping take increase calc');
    } else if (indexOfTarget != 0 && oldTake < targets[i].takePercent && targets[i-1].takePercent < 1 - targets[i-1].percentPerSingleHack) { //Recure up if we adjusted the take and not on the best target
      logger(ns, 'INFO: adjusted take, check previous Target(s).');
      indexOfTarget--;
      await TargetServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reservedThreads, reservedScripts, indexOfTarget, false);
    } else if (indexOfTarget + 1 >= targets.length) { //Stop when finished with last target fully adjusted and all others readjusted
      logger(ns, 'WARNING: Finished last target, but should only reach this if there are available threads and scripts to still use.');
    } else { //if we still have threads, scripts, and targets, and have loop up and back to here, check the next one
      //logger(ns, 'INFO: Calculating take for next Target.');
      indexOfTarget++;

      await TargetServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reservedThreads, reservedScripts, indexOfTarget);
    }
  }// end of adjustTake

}// end of active Target Class

/** Server Factory: given a hostname, and server type will create the server*/
export class ServerFactory {

  /** creates the servers
    * @param {NS} ns
    * @param {array} serverList
    * @param {array} files
    * @param {number} [neededRam=0] - ram per thread
    */
  async create(ns, serverList, files, neededRam=0){
    let inventory = {
      estThreads: 0,
      targets: [],
      drones: [],
      inactiveTargets: [],
      inactiveDrones: [],
      others:[],
    }

    for (let hostname of serverList) {
      //Check for valid hostname
      if (typeof(hostname) !== 'string' || !ns.serverExists(hostname)) {
        throw new Error(hostname + ' is not a valid string or a valid hostname.');
      }
      if (hostname == 'w0r1d_d43m0n' && ns.getServerRequiredHackingLevel(hostname) <= ns.getHackingLevel()) {
        logger(ns, 'Can backdoor w0r1d_d43m0n');
        ns.exec('map.js');
        ns.exit();
      }
      let built = false;
      /**Target and inactive target builds */
      if (getRoot(ns, hostname) &&
        ns.getServerRequiredHackingLevel(hostname) <= ns.getHackingLevel() &&
        ns.getServerMaxMoney(hostname) > 0 &&
        hostname != 'home') {
          inventory.targets.push(this.commonProps(ns, new TargetServer(ns, hostname), hostname, 'Target'));
          built = true;
        } else if (ns.getServerMaxMoney(hostname) > 0 && hostname != 'home'){
          inventory.inactiveTargets.push(this.commonProps(ns, new InactiveTarget(ns, hostname), hostname, 'InactiveTarget'));
          built = true;
        }
        /* Drones and InactiveDrones builds */
        if ((ns.getServerMaxRam(hostname) > 0 && getRoot(ns, hostname)) || hostname == 'home') {
          inventory.drones.push(this.commonProps(ns, new DroneServer(ns, hostname, neededRam), hostname, 'Drone', neededRam));
          built = true;
        } else if (ns.getServerMaxRam(hostname) > 0) {
          inventory.inactiveDrones.push(this.commonProps(ns, new InactiveDrone(ns, hostname, neededRam), hostname, 'InactiveDrone', neededRam));
          built = true;
        }
        /** others */
        if (!built) {
          inventory.others.push(hostname);
        }

    }

    //additional drone prep
    for (let drone of inventory.drones) {
      if(drone.hostname != 'home'){
        await ns.scp(files, drone.hostname, 'home');
        let running_scripts = ns.ps(drone.hostname);
        for (let script of running_scripts) {
          ns.kill(script.pid)
        }
      }
    }

    //sorts
    inventory.targets.sort(function(a,b) {
      return b.basePriority - a.basePriority;
    });
    inventory.drones.sort(function(a,b) {
      return b.maxRam - a.maxRam;
    });
    inventory.inactiveDrones.sort(function(a,b) {
      return a.numberOfPortsRequired - b.numberOfPortsRequired;
    });
    inventory.inactiveTargets.sort(function(a, b) {
      return a.requiredHackingSkill - b.requiredHackingSkill;
    });

    //calc ratio between each target and the next and last targets
    if (inventory.targets.length > 1) {
      TargetServer.betterThanNextLast(inventory.targets);
    }

    //collect the estimated number of available threads
    inventory.estThreads = inventory.drones.reduce((accumulator, drone) => {
      return accumulator + drone.threads;
    }, 0);

    // status message
    let bestTarget = inventory.targets[0];
    let bestDrone = inventory.drones[0];
    let targetMessage = 'Best target is ' + bestTarget.hostname + ' with a basic priority of ' + bestTarget.basePriority + '.  ';
    let droneMessage = 'Best drone is ' + bestDrone.hostname + ' with ' + truncateNumber(bestDrone.threads/inventory.estThreads*100, 2) + '% of threads.  ' + bestDrone.threads + '/' + inventory.estThreads;
    let message = targetMessage + droneMessage;
    logger(ns, message);

    //await fileDump(ns, inventory);


    //Targets ratio adjustments
    logger(ns, 'INFO: Starting adjustments, standby....');
    await TargetServer.adjustTake(ns, inventory.targets, inventory.estThreads);
    //await fileDump(ns, inventory, 'adjusteddump.txt');

    return inventory
  }//end of create

  commonProps(ns, server, hostname, serverType, neededRam=0) {
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

    /** Error Checking */
    if (serverType == 'Target') {
      if (server.idealVectorsPerBatch > server.realVectorsPerBatch(1000).totalVectors){
        let message = server.hostname + ' vector prediction error. Ideal: ' + server.idealVectorsPerBatch + ' Actual: ' + server.realVectorsPerBatch(1000).totalVectors +
                        ' Please check bitnode level info and core bonus info.';
        logger(ns, 'WARNING: ' + message);
      }
    }
    return server;
  }// end of commonProps

}//end of server Factory

/** Script class */
export class Script {
  constructor(ns, pid){
    this.ns = ns;
    this.pid = pid;
    this.threads;
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

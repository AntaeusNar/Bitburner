import {getRoot, realVectors, logger, evalVectorsPerBatch, evalWeakenTime, evalPercentTakePerHack, truncateNumber} from './lib.js';
import {baseDelay, maxScripts} from './options.js';


class BaseServer {
  constructor(ns, hostname, neededRam = 1.75) {
    this.ns = ns;
    this.hostname = hostname;
    this.neededRam = neededRam;
    this.numberOfPortsRequired = ns.getServerNumPortsRequired(hostname);
    this.maxRam = hostname === 'home' ? ns.getServerMaxRam(hostname) - 32 : ns.getServerMaxRam(hostname);
    this.moneyMax = hostname === 'home' ? 0 : ns.getServerMaxMoney(hostname);
    this.requiredHackingSkill = ns.getServerRequiredHackingLevel(hostname);
    this.minDifficulty = ns.getServerMinSecurityLevel(hostname);
    this.growthMultiplier = ns.getServerGrowth(hostname);
    this._takePercent = .001;
    this._isPrimedStr = false;
    this._isPrimedMoney = false;

    this.init()
  }

  get root() { return getRoot(this.ns, this.hostname); }
  get hasAdminRights() { return this.hostname === 'home' ? true : this.root; }
  get ramUsed() { return this.ns.getServerUsedRam(this.hostname); }
  get ramAvailable() { return this.root ? this.maxRam - this.ramUsed : 0; }
  get threads() { return truncateNumber(this.maxRam/this.neededRam, 0, 'floor'); }
  get moneyAvailable() { return this.ns.getServerMoneyAvailable(this.hostname); }
  get isHackable() { return this.requiredHackingSkill <= this.ns.getHackingLevel() ? true : false; }
  get numberOfThreads() { return truncateNumber(this.maxRam/this.neededRam, 0 , 'floor'); }
  get idealWeakenTime() { return evalWeakenTime(this, this.ns.getPlayer()); }
  get batchTime() { return truncateNumber(this.idealWeakenTime+baseDelay*5, 0, 'ceil'); }
  get percentPerSingleHack() { return evalPercentTakePerHack(this, this.ns.getPlayer()); }
  get batchesPerCycle() { return truncateNumber(this.batchTime/baseDelay, 0, 'floor'); }
  get cycleThreads() { return truncateNumber(this.batchesPerCycle*this.idealVectorsPerBatch, 0, 'ceil'); }
  get basePriority() { return truncateNumber(this.moneyMax/this.idealVectorsPerBatch/(this.batchTime)); }
  get actualVectorsPerBatch() { return evalVectorsPerBatch(this, this.ns.getPlayer()); }
  get adjustedPriority() { return truncateNumber((this.moneyMax*this.takePercent)/this.actualVectorsPerBatch/(this.batchTime)); }
  get ls() { return this.ns.ls(this.hostname); }
  get ps() { return this.ns.ps(this.hostname); }
  get growTime() { return this.ns.getGrowTime(this.hostname); }
  get weakenTime() { return this.ns.getWeakenTime(this.hostname); }
  get hackTime() { return this.ns.getHackTime(this.hostname); }
  get currentDifficulty() { return this.ns.getServerSecurityLevel(this.hostname); }

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

  get idealVectorsPerBatch() {
    let realTake = this._takePercent;
    this._takePercent = this.percentPerSingleHack;
    let result = evalVectorsPerBatch(this, this.ns.getPlayer());
    this._takePercent = realTake;
    return result;
  }

  get isPrimedStr() {
    if (this.ns.getServerSecurityLevel(this.hostname) == this.minDifficulty) {
      this._isPrimedStr = true;
    }
    return this._isPrimedStr;
  }
  set isPrimedStr(boolean) {
    this._isPrimedStr = boolean;
  }

  get isPrimedMoney() {
    if (this.moneyMax == this.moneyAvailable) {
      this._isPrimedMoney = true;
    }
    return this._isPrimedMoney;
  }
  set isPrimedMoney(boolean) {
    this._isPrimedMoney = boolean;
  }

  realVectorsPerBatch(maxThreads) {
    return realVectors(this.ns, this, maxThreads);
  }

  init() {
    this._takePercent = this.percentPerSingleHack;
    this.betterThanNext = 1;
    this.betterThanLast = 1;
    this.isPrimedStr;
    this.isPrimedMoney;
  }

  static betterThanNextLast(targets) {
    for (let i = 0; i+1 < targets.length; i++) {
      targets[i].betterThanNext = truncateNumber(targets[i].basePriority/Math.max(targets[i+1].basePriority, .001));
      targets[i].betterThanLast = truncateNumber(targets[i].basePriority/Math.max(targets[targets.length-1].basePriority, .001));
    }
  }

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

    if (i + 1 == targets.length) { //handling for last server in array
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
      /** Loop to increase the take % while
        * there scripts available, threads available, the take % is less then 99%
        * and the adjustedPriority of a is less then b.
        */
      // TODO: in late bitnode progression there maybe more threads available but no more scripts
        //need to figure out the control structures needed to max thread usage while under script usage
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
      await BaseServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reservedThreads, reservedScripts, indexOfTarget, false);
    } else if (indexOfTarget + 1 >= targets.length) { //Stop when finished with last target fully adjusted and all others readjusted
      logger(ns, 'WARNING: Finished last target, but should only reach this if there are available threads and scripts to still use.');
    } else { //if we still have threads, scripts, and targets, and have loop up and back to here, check the next one
      //logger(ns, 'INFO: Calculating take for next Target.');
      indexOfTarget++;

      await BaseServer.adjustTake(ns, targets, maxThreads, numBatchesPerCycle, reservedThreads, reservedScripts, indexOfTarget);
    }
  }

}

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
      // Sorting Hat
      let evalServer = new BaseServer(ns, hostname, neededRam);
      if (evalServer.moneyMax > 0) {
        if (evalServer.isHackable && evalServer.hasAdminRights) {
          inventory.targets.push(evalServer);
        } else {
          inventory.inactiveTargets.push(evalServer);
        }
      }

      if (evalServer.maxRam > 0) {
        if (evalServer.hasAdminRights) {
          inventory.drones.push(evalServer);
        } else {
          inventory.inactiveDrones.push(evalServer);
        }
      }

      if (evalServer.moneyMax == 0 && evalServer.maxRam == 0) {
        inventory.others.push(evalServer);
      }

    }

    //additional drone prep
    for (let drone of inventory.drones) {
      if(drone.hostname != 'home'){
        ns.scp(files, drone.hostname, 'home');
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
      BaseServer.betterThanNextLast(inventory.targets);
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

    //Targets ratio adjustments
    logger(ns, 'INFO: Starting adjustments, standby....');
    await BaseServer.adjustTake(ns, inventory.targets, inventory.estThreads);

    return inventory
  }//end of create

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

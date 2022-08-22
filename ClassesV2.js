import {can, getRoot, evalVectors, logger} from 'lib.js';
import {baseDelay} from 'options.js';

/** Basic Server Class */
export class BasicServer {
  //Private Class Properties
  #_hasAdminRights;

  /** Creates the most basic server object
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    this.ns = ns;
    this.hostname = hostname;
    this.hasAdminRights;
    this.numberOfPortsRequired = ns.getServerNumPortsRequired(hostname);
  }//end of constructor

  //getter for hasAdminRights
  get hasAdminRights() {
    //first check
    if (!this.#_hasAdminRights) {
      this.#_hasAdminRights = this.ns.hasRootAccess(this.hostname);
    }
    //second check with attempt to hack
    if (!this.#_hasAdminRights) {
      this.#_hasAdminRights = getRoot(this.ns, this.hostname);
    }
    return this.#_hasAdminRights;
  }//end of hasAdminRights

  toJSON() {
    return {
      hostname: this.hostname,
      hasAdminRights: this.hasAdminRights,
      numberOfPortsRequired: this.numberOfPortsRequired,
    }
  }//end of toJSON
}//end of Basic Server

/** Drone Server Class */
export class DroneServer extends BasicServer {
  /** Creates a Drone Server
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
    if (hostname == 'home') {
      this.maxRam = ns.getServerMaxRam(hostname) - 32;
    } else {
      this.maxRam = ns.getServerMaxRam(hostname);
    }
  }//end of constructor


  toJSON() {
    return {
      hostname: this.hostname,
      hasAdminRights: this.hasAdminRights,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
    }
  }//end of toJSON
}//end of DroneServer

/** Inactive Target class */
export class InactiveTargetServer extends BasicServer {
  /** Create an Inactive Target Server
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns, hostname);
    this.requiredHackingSkill = ns.getServerRequiredHackingLevel(hostname);
    this.minDifficulty = ns.getServerMinSecurityLevel(hostname);
    this.idealServerState = {
      hackDifficulty: this.minDifficulty,
      requiredHackingSkill: this.requiredHackingSkill
    };
    this.moneyMax = ns.getServerMaxMoney(hostname);
  }//end of constructor

  /** calculate the priority of a target
    * at a high level the priority will be $/threads/seconds
    * this is very variable.  The $ is based on % per single hacking thread, times
    * the chance of success, times the max money available, times the % we are hacking.
    * the % we are hacking is variable based on the total number of threads.
    * the number of threads is variable based on the % we are hacking, due to the number
    * of growth threads.
    * the number of growth threads required to refill the server uses math.log serveral times.
    * the number of threads is dependant on the the % we are hacking, the number of threads needed
    * to refill the target and then the weakens needed to balance it all out.
    * hacks are liniar, more % = more threads, additivly. weakens are simply hacks * .002/.05 + grows *.004/.05
    * grows though, increase exponetially.....
    * so to calculate this we need to know how many threads we have avialbe, calculate how many hacks, grows, weakens
    * we can deploy, get our priority number, and then sort everything by that number,
    * select the best, then reduce the number of threads, repeat with every other server agian,
    * and do that recusivly until we have a custome sort.  dick.
    */

  toJSON() {
    return {
      hostname: this.hostname,
      hasAdminRights: this.hasAdminRights,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax,
    }
  }//end of toJSON

}//end of InactiveTargetServer

/** Active Target Server Class */
export class TargetServer extends InactiveTargetServer {
  //Private Class Properties
  #_takePercent;
  #_isPrimedStr;
  #_isPrimedMoney;

  /** Create Target Server
    * @param {ns} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    super(ns,hostname);
    this.#_takePercent = .001;
    this.#_isPrimedStr = false;
    this.#_isPrimedMoney = false;
    this.isPrimedStr;
    this.isPrimedMoney;
    this.takePercent;

  }//end of constructor
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

  //the current takePercent
  get takePercent() {
    return Math.max(this.#_takePercent, this.percentPerSingleHack);
  }

  //sets the takePercent
  set takePercent(take) {
    //sets takePercent to a decimal between max 1 and min this.percentPerSingleHack
    this.#_takePercent = Math.max(Math.min(1, take), this.percentPerSingleHack);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      hasAdminRights: this.hasAdminRights,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax,
      isPrimedStr: this.isPrimedStr,
      isPrimedMoney: this.isPrimedMoney,
      takePercent: this.takePercent,
      percentPerSingleHack: this.percentPerSingleHack,
    }
  }
}

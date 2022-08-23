import {can, getRoot, realVectors, logger, evalVectorsPerBatch, evalWeakenTime, evalPercentTakePerHack} from 'lib.js';
import {baseDelay} from 'options.js';

/** InactiveDrone server class */
export class InactiveDrone {

  /** Creates an inactive drone
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname) {
    this.numberOfPortsRequired = ns.getServerNumPortsRequired(hostname);
    if (hostname == 'home') {
      this.maxRam = ns.getServerMaxRam(hostname) - 32;
    } else {
      this.maxRam = ns.getServerMaxRam(hostname);
    }
  }//end of constructor

  init() {
    logger(this.ns, 'Initialized InactiveDrone ' + this.hostname, 0);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
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

  init() {
    logger(this.ns, 'Initialized DroneServer ' + this.hostname, 0);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      maxRam: this.maxRam,
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
    return evalPercentTakePerHack(this.ns, this, this.ns.getPlayer());
  }

  get idealWeakenTime() {
    return evalWeakenTime(this.ns, this, this.ns.getPlayer());
  }

  init() {
    logger(this.ns, 'Initialized InactiveTarget ' + this.hostname, 0);
    this.isHackable;
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
    }
  }

}// end of active Target Class

/** Server Factory: given a hostname, and server type will create the server*/
export class ServerFactory {

  /** creates the servers
    * @param {NS} ns
    * @param {string} hostname
    * @param {string} serverType
    */
  create = (ns, hostname, serverType) => {
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
        if (!hasAdminRights) {
          this._hasAdminRights = getRoot(this.ns, this.hostname);
        }
        return this._hasAdminRights;
      }
    }
    Object.defineProperty(server, 'hasAdminRights', hasAdminRightsPattern);

    server.init();

    return server;
  }//end of create
}//end of server Factory

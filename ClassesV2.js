import {can, getRoot, realVectors, logger, evalVectorsPerBatch, evalWeakenTime} from 'lib.js';
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
  }

  init() {
    logger(this.ns, 'Initialized InactiveTarget ' + this.hostname, 0);
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax.
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
  }

  toJSON() {
    return {
      hostname: this.hostname,
      serverType: this.serverType,
      numberOfPortsRequired: this.numberOfPortsRequired,
      requiredHackingSkill: this.requiredHackingSkill,
      minDifficulty: this.minDifficulty,
      moneyMax: this.moneyMax.
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

    /** Targets only */
    if (serverType == 'Target' || serverType == 'InactiveTarget') {
      server.moneyMax = ns.getServerMaxMoney(hostname);
      server.requiredHackingSkill = ns.getServerRequiredHackingLevel(hostname);
      server.minDifficulty = ns.getServerMinSecurityLevel(hostname);
      //isHackable
      const isHackablePattern = {
        value: false,
        get() {
          if (this.hasAdminRights && this.requiredHackingSkill <= this.ns.getHackingLevel()){
            this.isHackable = true;
          }
          return this.isHackable;
        }
      }
      Object.defineProperty(server, 'isHackable', isHackablePattern);
    }
    
    /** Common to all properties */
    server.hostname = hostname;
    server.serverType = serverType;
    server.ns = ns;
    //hasAdminRights
    const hasAdminRightsPattern = {
      value: false,
      get() {
        if (!this.hasAdminRights) {
          this.hasAdminRights = this.ns.hasRootAccess(this.hostname);
        }
        if (!hasAdminRights) {
          this.hasAdminRights = getRoot(this.ns, this.hostname);
        }
        return this.hasAdminRights;
      }
    }
    Object.defineProperty(server, 'hasAdminRights', hasAdminRightsPattern);

    server.init();

    return server;
  }//end of create
}//end of server Factory

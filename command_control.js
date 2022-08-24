/** Command and Control Master script
  * Version 1
  * Derived from c_cv3 and spiderv2
  *
  * This script will control network focused hacking efforts
  */


/** Main Program
  * Recursivly scans the network, evals targets and drones, deploys (W)GWHW batchs on drone agianst targets
  * @param {NS} ns
  */
import {logger, getNeededRam, multiscan, fileDump, getRoot} from 'lib.js';
import {TargetServer, ServerFactory} from 'ClassesV2.js';
export async function main(ns) {

  //Initial Launch
  logger(ns, 'Launching Command and Control.')
  ns.disableLog('ALL');
  let files = ['lt-weaken.js', 'lt-grow.js', 'lt-hack.js'];
  let neededRam = getNeededRam(ns, files);


  //Recursivly Scan the network
  logger(ns, 'INFO: Scanning Network for Servers.');
  let serverList = multiscan(ns, 'home');
  logger(ns, ns.vsprintf('INFO: Found %d Servers on network.', serverList.length));

  // TODO: add in the ability to autopurcase access to the darkweb and port openers

  //Build working inventory of servers
  logger(ns, 'INFO: Building inventory of Servers');
  let inventory = {
    targets: [],
    drones: [],
    inactiveTargets: [],
    inactiveDrones: [],
  };
  const serverFactory = new ServerFactory();
  for (let i = 0; i < serverList.length; i++) {
    let serverhostname = serverList[i];
    logger(ns, 'INFO: Building ' + serverhostname, 0);
    if (ns.getServerRequiredHackingLevel(serverhostname) <= ns.getHackingLevel() &&
      ns.getServerMaxMoney(serverhostname) > 0 &&
      serverhostname != 'home' &&
      getRoot(ns, serverhostname)){
        inventory.targets.push(serverFactory.create(ns, serverhostname, 'Target'));
    } else if (ns.getServerMaxMoney(serverhostname) > 0 && serverhostname != 'home') {
      inventory.inactiveTargets.push(serverFactory.create(ns, serverhostname, 'InactiveTarget'));
    }
    if (ns.getServerMaxRam(serverhostname) > 0 && getRoot(ns, serverhostname)) {
      inventory.drones.push(serverFactory.create(ns, serverhostname, 'Drone', neededRam));
    } else if (ns.getServerMaxRam(serverhostname) > 0) {
      inventory.inactiveDrones.push(serverFactory.create(ns, serverhostname, 'InactiveDrone', neededRam));
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
    return b.numberOfPortsRequired - a.numberOfPortsRequired;
  });
  inventory.inactiveTargets.sort(function(a, b) {
    return b.requiredHackingSkill - a.requiredHackingSkill;
  });

  //calc ratio between each target and the next and last targets
  TargetServer.betterThanNextLast(inventory.targets);
  //collect the estimated number of available threads
  const estThreads = inventory.drones.reduce((accumulator, drone) => {
    return accumulator + drone.threads;
  }, 0);
  /**
  let bestTarget = inventory.targets[0];
  let betterThanNext = Math.floor((bestTarget.basePriority/inventory.targets[1].basePriority)*10)/10;
  let bestTargetMessage = 'Best Target is ' + bestTarget.hostname +
    ' with a basic priority of ' + bestTarget.basePriority +
    '. ' + betterThanNext + 'X better than ' + inventory.targets[1].hostname;
  logger(ns, bestTargetMessage);
  */
  await fileDump(ns, inventory);
  /**

  let maxRam = 0;
  for (let drone of drones) {
    maxRam += drone.maxRam;
  }

  //some general info for update
  let maxThreads = Math.floor(maxRam/neededRam);
  logger(ns, 'INFO: Have ' + targets.length + ' Targets and ' + drones.length +
    ' Drones. Best target is ' + targets[0].hostname + ' with a current ratio of ' + targets[0].ratio() + '. Best drone server is ' +
    drones[0].hostname + " with " + drones[0].maxRam + "GB ram. Max Ram is " + maxRam + 'GB yeilding ' + maxThreads + ' Threads.');

  //Targets ratio adjustments
  logger(ns, 'INFO: Starting adjustments, standby....');
  //await fileDump(ns, targets);
  await TargetServer.adjustTake(ns, targets, maxThreads);
  //await fileDump(ns, targets, 'adjusteddump.txt');

  */
  // TODO: deploy drone scripts on drones agianst targets
  // OPTIMIZE: check the deployments on home server and see if that reduces needed threads due to core upgrades (weakens and grows)
  // TODO: checks to reeval if new skill level or tools can access more targets/drones
  // TODO: add in the eval and purchase of persnal servers
  // TODO: add in the purchase of additional home ram

  // IDEA: look incorporating gang management and sleeve management
  // IDEA: faction server backdooring
  // IDEA: faction work management

} //end of Main Program

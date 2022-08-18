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
import {logger, getNeededRam, multiscan} from 'lib.js';
import {ServerFactory, BasicServer, DroneServer, TargetServer} from 'Classes.js';
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
  let inventory = [];
  const serverFactory = new ServerFactory();
  for (let i = 0; i < serverList.length; i++) {
    logger(ns, 'INFO: Building ' + serverList[i], 0);
    inventory.push(serverFactory.create(ns, serverList[i]));
  }

  //Filter inventory
  const targets = inventory.filter(obj => {
    return obj.isTarget;
  });
  const drones = inventory.filter(obj => {
    return obj.isDrone;
  });
  let maxRam = 0;
  for (let drone of drones) {
    maxRam += drone.maxRam
  }
  logger(ns, 'INFO: Have ' + targets.length + ' Targets and ' + drones.length + ' Drones.');
  let maxThreads = Math.floor(maxRam/neededRam);
  logger(ns, 'INFO: Max avaliable Ram is ' + maxRam + 'GB yeilding a max of ' + maxThreads + ' Threads.');

  //Targets ratio adjustments
  targets.sort(function(a,b) {
    logger(ns, 'INFO: ' + a.hostname + ' has ' + a.ratio() + " " + b.hostname + ' has ' + b.ratio);
    return (b.ratio() != null) - (a.ratio() != null) || b.ratio() - a.ratio();
  });
  logger(ns, 'INFO: Starting adjustments, standby....');
  await TargetServer.adjustTake(targets, maxThreads);
  for (let target of targets) {
    target.ns = null;
  }
  await ns.write('Full_Class.txt', JSON.stringify(targets, null, '\t'), 'w');


  /** BUG: Currently the estmated take from the-hub at 48% without formulas (best target) = 19B/sec
    * where the estimated take from alpha-ent at 5.6% with formulas (best target) = 10B/sec
    * this is doesn't make sense as first the formules should help get a better target
    * and second the current rate from c_cv3.js vs the hub is about 1B/sec
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

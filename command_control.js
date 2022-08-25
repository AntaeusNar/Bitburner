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
import {logger, getNeededRam, multiscan, fileDump, getRoot, truncateNumber, deployVectors} from 'lib.js';
import {TargetServer, ServerFactory} from 'ClassesV2.js';
import {baseDelay, maxScripts} from 'options.js';
export async function main(ns) {

  //Initial Launch
  logger(ns, 'Launching Command and Control.')
  ns.disableLog('ALL');
  let files = ['lt-weaken.js', 'lt-grow.js', 'lt-hack.js'];
  let neededRam = getNeededRam(ns, files);
  logger(ns, 'INFO: needed ram is ' + neededRam +'GB.');


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
    if (ns.getServerMaxRam(serverhostname) > 0 && getRoot(ns, serverhostname) || serverhostname == 'home') {
      inventory.drones.push(serverFactory.create(ns, serverhostname, 'Drone', neededRam));
    } else if (ns.getServerMaxRam(serverhostname) > 0) {
      inventory.inactiveDrones.push(serverFactory.create(ns, serverhostname, 'InactiveDrone', neededRam));
    }
  }

  //additional drone prep
  for (let drone in inventory.drones) {
    if(drone.hostname != 'home'){
      await ns.scp(files, 'home', drone.hostname);
      ns.killall(drone.hostname);
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

  // status message
  let bestTarget = inventory.targets[0];
  let bestDrone = inventory.drones[0];
  let targetMessage = 'Best target is ' + bestTarget.hostname + ' with a basic priority of ' + bestTarget.basePriority + '.  ';
  let droneMessage = 'Best drone is ' + bestDrone.hostname + ' with ' + truncateNumber(bestDrone.threads/estThreads*100, 2) + '% of threads.  ' + bestDrone.threads + '/' + estThreads;
  let message = targetMessage + droneMessage;
  logger(ns, message);

  await fileDump(ns, inventory);


  //Targets ratio adjustments
  logger(ns, 'INFO: Starting adjustments, standby....');
  await TargetServer.adjustTake(ns, inventory.targets, estThreads);
  await fileDump(ns, inventory, 'adjusteddump.txt');

  if (ns.args[0]) {
    logger(ns, 'WARNING: Requested test run only, exiting');
    throw '';
  }
  /** Main Control loop
    * Deploy drone scripts on drones against targets
    */
  //loop initalization
  let cycle = 1;
  let batch = 1;
  let sleepTime = baseDelay;
  let actualNumOfBatches = 0;


  logger(ns, 'INFO: Starting Main Loop');
  //Main loop
  while (true) {
    //logging
    logger(ns, 'INFO: Cycle #: ' + cycle + ' Batch #: ' + batch, 0);

    /** Interive deployment handling */
    let i = 0;
    let usableThreads = estThreads;
    let usableScripts = maxScripts;

    while (i < inventory.targets.length &&
      usableThreads > 0 &&
      usableScripts > 0) {
        let currentTarget = inventory.targets[i];
        let cycleBatch = cycle + '/'+ batch;
        let results = deployVectors(ns, currentTarget, inventory.drones, usableThreads, usableScripts, files, cycleBatch);
        if (!results.successful) {
          logger(ns, 'WARNING: Vector deployment against' + currentTarget.hostname + ' failed, stopping deployments.');
          break;
        }

        /**Main Control Loop timing prep */
        if (i == 0) {
          let maxNumBatches = Math.min(usableThreads/results.vectors.totalVectors, usableScripts/4);
          let theoryTime = Math.max(results.batchTime/maxNumBatches, baseDelay);
          actualNumOfBatches = Math.floor(results.batchTime/theoryTime);
          sleepTime = Math.ceil(results.batchTime/actualNumOfBatches);
        }

        //logging
        let reservedThreads = actualNumOfBatches*results.vectors.totalVectors;
        let reservedScripts = actualNumOfBatches*results.deployedScripts;
        let message = 'Target: ' + currentTarget.hostname + ' @ ' + currentTarget.takePercent*100 + '%' +
          ' Hacks/Vectors/Reserve/Usable Threads: ' + results.vectors.hackThreads + '/' + results.vectors.totalVectors+ '/' + reservedThreads + '/' + usableThreads +
          ' Reserve/Usable Scripts: ' + reservedScripts + '/' + usableScripts;
        logger(ns, message, 0);

        /** Interive Loop Cleanup */
        usableScripts -= reservedScripts;
        usableThreads -= reservedThreads;
        i++;
        await ns.sleep(1);
      }//end of iterive deployment handling

      if ( usableThreads <= 0) {
        logger(ns, 'INFO: Ran out of threads.');
      } else if (usableScripts <= 0) {
        logger(ns, 'INFO: Ran out of Scipts');
      }

      // BUG: Seems to be deploying against fewer targets then anticipated
      // BUG: Is deploying more scripts then limit
      // BUG: seems to be producing 1/2ish of c_cv3.js

      // TODO: checks to reeval if new skill level or tools can access more targets/drones
      // TODO: add in the eval and purchase of persnal servers
      // TODO: add in the purchase of additional home ram

      // IDEA: look incorporating gang management and sleeve management
      // IDEA: faction server backdooring
      // IDEA: faction work management

      /** Main Control Loop timing handling */
      let waitTime = new Date(sleepTime).toISOString().substr(11,12);
      logger(ns, 'INFO: Waiting: ' + waitTime + ' # of Batches in cycle: ' + actualNumOfBatches, 0);
      batch++;
      if (batch >= actualNumOfBatches) {
        cycle++;
        batch = 1;
      }

  }//end of main control loop



} //end of Main Program

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
  for (let drone of inventory.drones) {
    if(drone.hostname != 'home'){
      await ns.scp(files, drone.hostname, 'home');
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
  let pids = [];

  logger(ns, 'INFO: Starting Main Loop');
  //Main loop
  while (true) {

    /** PID/Scripts/Threads Control Section */
    pids = pids.filter(pid => ns.getRunningScript(pid) != null);
    let activePids = pids.length;
    let usableScripts = Math.max(maxScripts - activePids, 0);
    let activeThreads = 0;
    pids.forEach(pid => activeThreads += ns.getRunningScript(pid).threads);
    let usableThreads = Math.max(estThreads - activeThreads, 0);

    //logging
    let cycleBatchMessage = 'Cycle #: ' + cycle + ' Batch #: ' + batch + '.  ';
    let scriptsMessage = 'Deployed/Available Scripts: ' + activePids + '/' + usableScripts + '.  ';
    let threadsMessage = 'Deployed/Available Threads: ' + activeThreads + '/' + usableThreads + '. ';
    logger(ns,  'INFO: ' + cycleBatchMessage + scriptsMessage + threadsMessage, 0);

    /** Interive deployment handling */
    let i = 0;
    let setBreak = false;

    while (i < inventory.targets.length &&
      usableThreads > 0 &&
      usableScripts > 0) {
        let currentTarget = inventory.targets[i];
        let cycleBatch = cycle + '/'+ batch;
        let results = deployVectors(ns, currentTarget, inventory.drones, usableThreads, usableScripts, files, cycleBatch);
        if (!results.successful) {
          logger(ns, 'WARNING: Vector deployment against ' + currentTarget.hostname + ' incomplete, stopping deployments.', 0);
          setBreak = true;
        } else {setBreak = false;}
        //PIDS/Scripts/Threads update
        let newPids = results.pids;
        let newScripts = results.pids.length;
        let newThreads = 0;
        newPids.forEach(pid => newThreads += ns.getRunningScript(pid).threads);
        usableScripts -= newScripts;
        usableThreads -= newThreads;
        pids.push(...newPids);


        /**Main Control Loop timing prep */
        if (i == 0) {
          let maxNumBatches = Math.max(1, Math.min(estThreads/results.vectors.totalVectors, maxScripts/4));
          let theoryTime = Math.max(results.batchTime/maxNumBatches, baseDelay);
          actualNumOfBatches = Math.floor(results.batchTime/theoryTime);
          sleepTime = Math.ceil(results.batchTime/actualNumOfBatches);
        }

        //logging
        let message = 'Target: ' + currentTarget.hostname + ' @ ' + currentTarget.takePercent*100 + '%' +
          ' Hacks/Vectors/Usable Threads: ' + results.vectors.hackThreads + '/' + results.vectors.totalVectors+ '/' + usableThreads +
          ' Usable Scripts: ' + usableScripts;
        logger(ns, message, 0);

        /** Interive Loop Cleanup */
        if (setBreak) {break;};
        i++;
        await ns.sleep(1);
      }//end of iterive deployment handling

      if (usableThreads <= 0) {
        logger(ns, 'INFO: Ran out of threads.', 0);
      } else if (usableScripts <= 0) {
        logger(ns, 'INFO: Ran out of Scipts', 0);
      }

      // TODO: switch everything around when just needing to gain exp.

      // IDEA: look incorporating gang management and sleeve management
      // IDEA: faction server backdooring
      // IDEA: faction work management

      /**Upgrade Control Section */
      // TODO: checks to reeval if new skill level or tools can access more targets/drones
      // TODO: add in the eval and purchase of persnal servers
      let setReSpawn = false;
      if (ns.singularity.upgradeHomeRam()) {
        setReSpawn = true;
        logger(ns, 'INFO: Upgraded Home Ram, requesting respawn')
      }

      //respawn self
      if (setReSpawn){
        logger(ns, 'INFO: Respawn Requested, killing controlled scripts and respawning, please standby...')
        //kill all controled scripts
        pids.forEach(pid => ns.kill(pid));
        //respawn self
        ns.spawn('command_control.js');
      }

      /** Main Control Loop timing handling */
      let waitTime = new Date(sleepTime).toISOString().substr(11,12);
      logger(ns, 'INFO: Waiting: ' + waitTime + ' # of Batches in cycle: ' + actualNumOfBatches, 0);
      batch++;
      if (batch >= actualNumOfBatches) {
        cycle++;
        batch = 1;
      }
      await ns.sleep(sleepTime);
  }//end of main control loop
} //end of Main Program

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
import {logger, getNeededRam, multiscan, deployVectors} from 'lib.js';
import {ServerFactory, Script} from 'ClassesV2.js';
import {baseDelay, maxScripts, budgetPercentageLimit} from 'options.js';
export async function main(ns) {

  //Initial Launch
  logger(ns, 'Launching Command and Control.')
  ns.disableLog('ALL');
  //ns.enableLog('exec');
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
  const serverFactory = new ServerFactory();
  let inventory = await serverFactory.create(ns, serverList, files, neededRam);

  if (ns.args[0] == true) {
    logger(ns, 'WARNING: Requested test run only, exiting');
    ns.exit();
  }

  /** Main Control loop
    * Deploy drone scripts on drones against targets
    */
  //loop initalization
  let cycle = 1;
  let batch = 1;
  let sleepTime = baseDelay;
  let actualNumOfBatches = 0;
  let trackedScripts = [];
  let usableScripts = 0;
  let usableThreads = 0;
  let setRestart = false;

  logger(ns, 'INFO: Starting Main Loop');
  //Main loop
  while (true) {

    /** PID/Scripts/Threads Tracking Reconciliation */
    //uses the running tracker of active scripts to see how many of the threads/scripts are in use at the start each batch
    if ((cycle == 1 && batch == 1) || setRestart) {//should run on first batch/cycle only or restart
      usableScripts = maxScripts;
      usableThreads = inventory.estThreads;
    } else {
      trackedScripts = trackedScripts.filter(pid => pid.isActive);
      let inUseThreads = 0;
      let inUseScripts = trackedScripts.length;
      trackedScripts.forEach( pid => inUseThreads += pid.threads)
      usableThreads = inventory.estThreads - inUseThreads;
      usableScripts = maxScripts - inUseScripts;
    }

    //logging
    let cycleBatchMessage = 'Start Cycle #: ' + cycle + ' Batch #: ' + batch + '.  ';
    let deployedScripts = maxScripts - usableScripts;
    let deployedThreads = inventory.estThreads - usableThreads;
    let scriptsMessage = 'Deployed/Available Scripts: ' + deployedScripts + '/' + maxScripts + '.  ';
    let threadsMessage = 'Deployed/Available Threads: ' + deployedThreads + '/' + inventory.estThreads + '. ';
    logger(ns,  'INFO: ' + cycleBatchMessage + threadsMessage + scriptsMessage, 0);

    /** Interive deployment handling */
    let i = 0;
    let setBreak = false;

    while (i < inventory.targets.length &&
      usableThreads > inventory.targets[i].idealVectorsPerBatch &&
      usableScripts > 4) {
        /** Main Iterive Deployment Section */
        //Inside of each batch, selects a target and attempts to deploy vectors as scripts and threads against the target across the drone network
        let currentTarget = inventory.targets[i];
        let cycleBatch = cycle + '/'+ batch;
        let results = deployVectors(ns, currentTarget, inventory.drones, usableThreads, usableScripts, files, cycleBatch);
        if (!results.successful) {
          logger(ns, 'WARNING: Vector deployment against ' + currentTarget.hostname + ' incomplete, stopping deployments.', 0);
          setBreak = true;
        } else {setBreak = false;}

        /**Main Control Loop timing prep */
        if (i == 0 && results.successful) {
          let maxNumBatches = Math.max(1, Math.min(inventory.estThreads/results.vectors.totalVectors, maxScripts/4));
          let theoryTime = Math.max(results.batchTime/maxNumBatches, baseDelay);
          actualNumOfBatches = Math.floor(results.batchTime/theoryTime);
          sleepTime = Math.ceil(results.batchTime/actualNumOfBatches);
        } else if (i == 0 && !results.successful){
          logger(ns, 'WARNING: Primary Target deployments unsuccessful.  Allowing cleanup to happen.');
          sleepTime = currentTarget.batchTime;
        }

        /** PID/Scripts/Threads Tracking Update Section */
        //adds the newly deployed PIDS to the running tracker, reduces the number of usable scripts/threads by actually Deployed
        //or in the case of the first cycle, how many are needed to be set aside to complete cycle deployment
        let newPids = []
        results.pids.forEach(pid => newPids.push(new Script(ns, pid)));
        let newScripts = results.pids.length;
        let newThreads = 0;
        newPids.forEach(pid => newThreads += pid.threads);
        //reserve out enough threads and scripts to complete the cycle
        usableScripts -= Math.min(newScripts*(1 + actualNumOfBatches - batch), usableScripts);
        usableThreads -= Math.min(newThreads*(1 + actualNumOfBatches - batch), usableThreads);

        newPids.forEach(pid => trackedScripts.push(pid));

        //logging
        let message = 'Target: ' + currentTarget.hostname + ' @ ' + currentTarget.takePercent*100 + '%' +
          ' Hacks/Vectors/Remaining Threads: ' + results.vectors.hackThreads + '/' + results.vectors.totalVectors+ '/' + usableThreads +
          ' Remaining Scripts: ' + usableScripts;
        logger(ns, message, 0);

        /** Interive Loop Cleanup */
        if (setBreak) {break;};
        i++;
        await ns.sleep(1);
      }//end of iterive deployment handling

      // TODO: switch everything around when just needing to gain exp.

      // IDEA: look incorporating gang management and sleeve management
      // IDEA: faction server backdooring
      // IDEA: faction work management

      /**Upgrade Control Section */
      // TODO: try to purchase new tools if needed.
      // TODO: add in the eval and purchase of persnal servers
      setRestart = false;
      if (ns.getServerMoneyAvailable('home')* budgetPercentageLimit > ns.singularity.getUpgradeHomeRamCost() && ns.singularity.upgradeHomeRam()) {
        setRestart = true;
        logger(ns, 'INFO: Upgraded Home Ram, requesting restart.')
      }
      if (inventory.inactiveDrones.length > 0 && inventory.inactiveDrones[0].hasAdminRights) {
        setRestart = true;
        logger(ns, 'INFO: New Drone Available, requesting restart.')
      }
      if (inventory.inactiveTargets.length > 0 && inventory.inactiveTargets[0].hasAdminRights && inventory.inactiveTargets[0].requiredHackingSkill <= ns.getHackingLevel()){
        setRestart = true;
        logger(ns, 'INFO: New Target Available, requesting restart.')
      }
      if (inventory.others.length > 0 && inventory.others.includes('w0r1d_d43m0n') && ns.getServerRequiredHackingLevel('w0r1d_d43m0n') <= ns.getHackingLevel()) {
        logger(ns, 'INFO: w0r1d_d43m0n is available, Shutting Down');
        trackedScripts.forEach(script => ns.kill(script.pid));
        ns.exit();
      }

      /** Main Control Loop timing handling  && Logging*/
      deployedScripts = maxScripts - usableScripts;
      deployedThreads = inventory.estThreads - usableThreads;
      scriptsMessage = 'Deployed or Reserved/Available Scripts: ' + deployedScripts + '/' + maxScripts + '.  ';
      threadsMessage = 'Deployed or Reserved/Available Threads: ' + deployedThreads + '/' + inventory.estThreads + '.  ';
      let waitTime = new Date(sleepTime).toISOString().substr(11,12);
      let timeMessage = 'Waiting: ' + waitTime + ' # of Batches in cycle: ' + actualNumOfBatches + '.  ';
      logger(ns, 'INFO: ' + timeMessage + threadsMessage + scriptsMessage, 0);
      batch++;

      if (batch > actualNumOfBatches) {
        cycle++;
        batch = 1;
      }

      //respawn self
      if (setRestart){
        logger(ns, 'INFO: Restart Requested, killing controlled scripts and restarting, please standby...')
        //kill all controled scripts
        trackedScripts.forEach(script => ns.kill(script.pid));
        //resetting initalization
        //loop initalization
        sleepTime = baseDelay;
        actualNumOfBatches = 0;
        trackedScripts = [];
        usableScripts = 0;
        usableThreads = 0;
        serverList = multiscan(ns, 'home');
        inventory = await serverFactory.create(ns, serverList, files, neededRam);
      } else {
        await ns.sleep(sleepTime);
      }
  }//end of main control loop
} //end of Main Program

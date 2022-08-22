import {baseDelay} from 'options.js';
/** Checks for existance of file on the spesified or home server
  * @param {NS} ns
  * @param {string} file - File Name
  * @param {string} [serverName=home] - hostname of server
  * @return {boolean} true if file exists on the server
  */
export function can(ns, file, serverName='home') {
	return ns.fileExists(file, serverName);
}

/**Outputs stuff to file as a troublshooting step using JSON.strinify and write
	* @param {NS} ns
	* @param {data} data
	* @param {sting} [filename='dumpfile.txt']
	*/
export async function fileDump(ns, data, filename='dumpfile.txt') {
	if (ns.fileExists(filename)) {
		ns.rm(filename);
	}
	await ns.write(filename, JSON.stringify(data, null, '\t'), 'w');
}

/** Given a server object, will attempt to gain root
* @param {ns} ns
* @param {string} hostname
* @returns {boolean} result
*/
export function getRoot(ns, hostname) {
	let result = false;
	let ports = 0;
		if (can(ns, "brutessh.exe")) { ns.brutessh(hostname); ++ports; }
		if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(hostname); ++ports; }
		if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(hostname); ++ports; }
		if (can(ns, "httpworm.exe")) { ns.httpworm(hostname); ++ports; }
		if (can(ns, "sqlinject.exe")) { ns.sqlinject(hostname); ++ports; }
		if (ports >= ns.getServerNumPortsRequired(hostname)) {
			ns.nuke(hostname);
			if (ns.hasRootAccess(hostname)){
				result = true;
			}
		}
	return result;
}

/** Logger print function
 * @param {NS} ns
 * @param {string} message
 * @param {number} [options=2] - 0 program log, 1 terminal log, 2 both
 */
export function logger(ns, message, options=2) {
 switch (options) {
   case 0:
     ns.print(message);
     break;
   case 1:
     ns.tprint(message);
     break;
   case 2:
   default:
     ns.print(message);
     ns.tprint(message);
 }
}

/** number of milliseconds to ISO date string 00:00:00.000
  * @param {number} milliseconds
  * @return {string} ISO format 00:00:00.000
  */
export function milString(milliseconds) {
  return new Date(milliseconds).toISOString().substr(11,12);
}

/** Lets round a number...please....
	* @param {number} number
	* @param {number} precision
	*/
export function precisionRound(number, precision) {
	let factor = Math.pow(10, precision);
	let n = precision < 0 ? number : 0.01 / factor + number;
	return Math.round( n * factor ) / factor;
}

/** Given an array of files, will return the max ram requirements
  * @param {NS} ns
  * @param {array} files - list of file names
  * @return {number} maxium needed ram
  */
export function getNeededRam(ns, files) {
	let needRam = 0;
	for (let file of files) {
    if (can(ns, file)) {
      if (ns.getScriptRam(file) > needRam) {
  			needRam = ns.getScriptRam(file);
  		}
    } else {
      ns.tprintf('WARNING: File %s not found on home, the ram calculation will be wrong.', file);
    }
	}
	return needRam;
}

/** Given a server, will recursivly scan until all servers are found
  * @param {NS} ns
  * @param {string} [serverName=home] - hostname of starting server
  * @return {array} list of all found server hostnames
  */
export function multiscan(ns, serverName='home') {
  let serverList = [];
  function scanning(serverName) {
    let currentScan = ns.scan(serverName);
    currentScan.forEach(serverName => {
      if (!serverList.includes(serverName)) {
        serverList.push(serverName);
        scanning(serverName);
      }
    })
  }
  scanning(serverName);
  return serverList;
}

/**
  * @typedef {Object} Vectors
  * @property {number} totalVectors - Total number of vectors
  * @property {number} primeWeaken - Number of primary weaken()s (optional)
  * @property {number} growThreads - Number of grow()s
  * @property {number} growWeakens - Number of weaken()s to counter the grow()s
  * @property {number} hackThreads - Number of hack()s
  * @property {number} hackWeakens - Number of weaken()s to counter the hack()s
  */

/** evalVectors: calculates the number of (W)GWHW threads
  * @param {NS} ns
  * @param {Object} server - server class object
  * @param {number} [maxThreads=Infinity] - max number of available threads
  * @param {boolean} [dryrun=true]
  * @returns {Vectors} calculated attack vectors
  */
/** used 3 times, first dry run to get initial ratio, second dry run to increase take, thrid for real world deployments */
export function evalVectors(ns, server, maxThreads = Infinity, dryrun=true) {

  //setup
  const weakenRate = .05;
  const growRate = .004;
  const hackRate = .002;
  var vectors = {
    primeWeaken: 0,
    growThreads: 0,
    growWeakens: 0,
    hackThreads: 0,
    hackWeakens: 0,
		totalVectors: 0,
  }

  //Primary Weaken: only done on !dryrun and if !isPrimedStr
  if(!server.isPrimedStr && !dryrun) {
    let currentDifficulty = ns.getServerSecurityLevel(server.hostname); //get current security level
    let targetPrimeWeakens = Math.ceil((currentDifficulty - server.minDifficulty)/weakenRate); //calc totale needed weaken threads
    vectors.primeWeaken = Math.min(targetPrimeWeakens, maxThreads); //stay inside available threads
    vectors.totalVectors = vectors.primeWeaken; //update total vectors
    maxThreads -= vectors.totalVectors; //reduce maxThreads
		// TODO: move this isPrimedStr set to only when deployment works
    if (vectors.primeWeaken == targetPrimeWeakens && !dryrun) {server.isPrimedStr = true;} //setting the isPrimedStr flag to true
  }

  //continue if there is a min of 4 threads (one each for GWHW)
  if (maxThreads > 4 ) {

    //Calc grow() and weaken() threads
    //setup
    let growthMultiplier = 0;
    let targetGrowThreads = 0;
    let targetgrowWeakens = 0;
    let growBypass = false;

    //Calc growthMultiplier
    if (dryrun || server.isPrimedMoney) { //on dryrun or isPrimedMoney get min growth
			//includes handleing for all money gone.
      growthMultiplier = server.moneyMax/Math.max(1, (server.moneyMax * (1 - server.takePercent)));
    } else { //get needed growth
      growthMultiplier = server.moneyMax/Math.max(1, server.moneyAvailable);
    }
    //calc number of threads
    targetGrowThreads = Math.ceil(ns.growthAnalyze(server.hostname, growthMultiplier));
    targetgrowWeakens = Math.ceil(vectors.growThreads*growRate/weakenRate);

    //adjusting the grow() + weaken() count to inside the maxThreads limit if needed
    if (targetGrowThreads + targetgrowWeakens > maxThreads) {
      logger(ns, 'WARNING: Scaling down the growth threads for '+ server.hostname);
      //Math says that for every 25 grow()s you need 2 weaken()s => groups of 27
      let numGroups = Math.floor(maxThreads/27);
      targetGrowThreads = numGroups*25;
      targetgrowWeakens = numGroups*2;
      growBypass = true;
    }

    //adjust the Grow and weakens to atleast one
    targetGrowThreads = Math.max(1, targetGrowThreads);
    targetgrowWeakens = Math.max(1, targetgrowWeakens);

    vectors.growThreads = Math.min(targetGrowThreads, maxThreads);//stay inside maxThreads
    vectors.totalVectors += vectors.growThreads;//update total vectors
    maxThreads -= vectors.growThreads; //reduce maxThreads
    vectors.growWeakens = Math.min(targetgrowWeakens, maxThreads);//stay inside maxThreads
    vectors.totalVectors += vectors.growWeakens;//update total vectors
    maxThreads -= vectors.growWeakens;//reduce maxThreads

    if (!server.isPrimedMoney && !growBypass &&
      vectors.growThreads == targetGrowThreads &&
			vectors.growWeakens == targetgrowWeakens &&
			!dryrun) {
				// TODO: should be moved to completed deployments
				server.isPrimedMoney = true; //set the isPrimedMoney flag if was false, not bypassed & needed threads are allocated
    }

    //Calc hack() and matching weaken()
    //continue if there is a min of 2 threads (one each for HW) && target server is fully primed
    //or if a dryrun
    if (dryrun || (maxThreads > 2 && server.isPrimedMoney && server.isPrimedStr)) {

      //calc number of hack() threads needed to steal takePercent of server money
      let targetHackThreads = Math.ceil(server.takePercent/server.percentPerSingleHack);
      let targethackWeakens = Math.ceil(targetHackThreads*hackRate/weakenRate);

      //adjust the hack()s + weaken()s count to inside the maxThreads limit if needed
      if (targetHackThreads + targethackWeakens > maxThreads) {
        logger(ns, 'WARNING: Scaling down the hack threads for ' + server.hostname);
        //Math says that for every 25 hack()s you need 1 weaken() => groups of 26
        numGroups = Math.floor(maxThreads/26);
        targetHackThreads = numGroups*25;
        targethackWeakens = numGroups;
      }

      //make sure we have atleast one each
      targetHackThreads = Math.max(1, targetHackThreads);
      targethackWeakens = Math.max(1, targethackWeakens);

      vectors.hackThreads = Math.min(targetHackThreads, maxThreads);//stay inside maxThreads
      vectors.totalVectors += vectors.hackThreads; //update total vectors
      maxThreads -= vectors.hackThreads; //reduce maxThreads
      vectors.hackWeakens = Math.min(targethackWeakens, maxThreads); //stay inside maxThreads
      vectors.totalVectors += vectors.hackWeakens; //update total vectors
      maxThreads -= vectors.hackWeakens; //reduce maxThreads
    }

  }
	for (let i in vectors) {
		if (isNaN(vectors[i]) || vectors[i] == null) {
			throw new Error(server.hostname + ' has an invalid vector result in ' + i + ': ' + JSON.stringify(vectors));
		}
	}
  return vectors;
}// end of evalVectors

/** deployVectors: deploys attack vectors across the drone network
	* @param {ns} ns
	* @param {Server} target - target to be attacked
	* @param {array} drones - drones to be used
	* @param {number} maxThreads - max total threads
	* @param {array} fileNames - files to be deployed
	* @param {string} cycleBatch - cycle/batch # to pass as arg to deployed scripts
	*/
export function deployVectors(ns, target, drones, maxThreads, fileNames, cycleBatch) {
	/** Setup */
	//Files
	let weakenFile = fileNames[0];
	let growFile = fileNames[1];
	let hackFile = fileNames[2];
	//Timing
	// TODO: adjust this section to account to hitting a primed target with Formulas.exe
	let weakenTime = ns.getWeakenTime(target.hostname);
	let growTime = ns.getGrowTime(target.hostname);
	let hackTIme = ns.getHackTime(target.hostname);
	let stageTwoDelay = weakenTime + baseDelay - growTime;
	let stageThreeDelay = baseDelay * 2;
	let stageFourDelay = baseDelay * 3 + weakenTime - hackTime;
	let stageFiveDelay = baseDelay * 4;
	//Vectors
	let vectors = evalVectors(ns, target, maxThreads, false);
	//Control Tacking
	let successful = false;
	/** Deployment Control
		* Calculate delays, deploy (W)GWHW vectors in 5 stages
		*/
	// timing calcualations





}//end of deployVectors

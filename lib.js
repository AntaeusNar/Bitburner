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

/**calculate Inteligence bonus
	* ->https://github.com/danielyxie/bitburner/blob/dev/src/PersonObjects/formulas/intelligence.ts
	* @param {number} intelligence
	* @param {number} weight
	* @return {number}
	*/
export function calculateIntelligenceBonus(intelligence, weight) {
	return 1 + (weight * Math.pow(intelligence, 0.8))/600;
}

/** trucateNumber: given a number, number of decimals, and ceil,floor or round
	* adjusts the number to match
	* @param {number} number
	* @param {number} [decimal=3]
	* @param {string} [type=round]
	* @returns {number}
	*/
export function truncateNumber(number, decimal = 3, type = 'round'){
	let result = null;
	let factor = 10 ** decimal;
	if (type =='round') {
		result = Math.round(number*factor)/factor;
	} else if (type == 'ceil') {
		result = Math.ceil(number*factor)/factor;
	} else if (type =='floor'){
		result = Math.floor(number*factor)/factor;
	}
	return result;
}

/** evalPercentTakePerHack: calculates the % takes per single hack thread
	* https://github.com/danielyxie/bitburner/blob/dev/src/Hacking.ts
	* @param {NS} ns
	* @param {Object} server
	* @param {Object} player
	*/
export function evalPercentTakePerHack(ns, server, player) {
	/** Setup */
	let playerHackingSkill = Math.max(server.requiredHackingSkill, player.skills.hacking);
	let bitNodeMultipliers = {
		ScriptHackMoney: 1
	};
	let difficultyMult = (100 - server.minDifficulty) / 100;
	//calculatePercentPerThread
	let skillMult = (playerHackingSkill - (server.requiredHackingSkill -1)) / playerHackingSkill;
	let balanceFactor = 240;
	let percentPerSingleHack = (difficultyMult * skillMult * player.mults.hacking_money * bitNodeMultipliers.ScriptHackMoney) / balanceFactor;
	//CalculateHackChance
	let skillMultChance = 1.75 * playerHackingSkill;
	let skillChance = (skillMultChance - server.requiredHackingSkill) / skillMultChance;
	let chancePerHack = skillChance * difficultyMult * player.mults.hacking_chance * calculateIntelligenceBonus(player.skills.intelligence, 1);
	return percentPerSingleHack/chancePerHack;
}// end of evalPercentTakePerHack

/** evalVectorsPerBatch: calculates the number of GWHW threads under Ideal settings
 	* ONLY USED for establishing priority of targets, NOT FOR REALWORLD USE
	* @param {NS} ns
	* @param {Object} server
	* @param {Object} player
	* @returns {number} caclulated total attack vectors
	*/
export function evalVectorsPerBatch(ns, server, player) {

	/** Setup */
	const weakenRate = .05;
	const growRate = .004;
	const hackRate = .002;
	//in order to eval even if the players hacking level is too low
	let playerHackingSkill = Math.max(server.requiredHackingSkill, player.skills.hacking);
	//placeholder for bitnode info // TODO: replace or upgrade with a check to get actual.
	let bitNodeMultipliers = {
		ScriptHackMoney: 1,
		ServerGrowthRate: 1,
	}

	/** Grow Threads -> https://github.com/danielyxie/bitburner/blob/dev/src/Server/ServerHelpers.ts*/
  let growth = server.moneyMax/Math.max(1, (server.moneyMax * (1-server.takePercent)));
  let ajdGrowthRate = Math.min(1.0035, 1 + (1.03-1)/server.minDifficulty);
  let serverGrowthPercentage = ns.getServerGrowth(server.hostname)/100;
  let coreBonus = 1/16;
  let bitMult = 1; //complete hack of a number....looking it up requires being in BN 5 or owning SF-5 (singularity)

  let growThreads = Math.ceil(Math.log(growth) / (Math.log(ajdGrowthRate) * player.mults.hacking_grow * serverGrowthPercentage * bitNodeMultipliers.ServerGrowthRate * coreBonus));

  /** Hack Threads */
  let hackThreads = Math.ceil(server.takePercent/evalPercentTakePerHack(ns, server, player));

  /** Weaken Threads */
  let weakenThreads = Math.ceil(hackThreads*hackRate/weakenRate) + Math.ceil(growThreads*growRate/weakenRate);

  /** Wrap-up */
  let totalVectors = Math.max(growThreads + hackThreads + weakenThreads, 4);
  return totalVectors;

}//end of evalVectorsPerBatch

/** evalHackingTime -> https://github.com/danielyxie/bitburner/blob/dev/src/Hacking.ts
	* EVAL ONLY! will NOT reflect realworld
	* @param {Object} server
	* @param {Object} player
	* @returns {number} hacking time in seconds
	*/
export function evalHackingTime(server, player) {
	//setup for ideal
	let playerHackingSkill = Math.max(player.skills.hacking, server.requiredHackingSkill);

	const difficultyMult = server.requiredHackingSkill * server.minDifficulty;
	const baseDiff = 500;
	const baseSkill = 50;
	const diffFactor = 2.5;
	let skillFactor = diffFactor * difficultyMult + baseDiff;
	skillFactor /= playerHackingSkill + baseSkill;
	const hackTimeMultiplier = 5;
	const hackingTime = (hackTimeMultiplier * skillFactor) / (player.mults.hacking_speed * calculateIntelligenceBonus(player.skills.intelligence, 1));
	if (hackingTime > server.ns.getHackTime(server.hostname)) {
		throw new Error('evalHackingTime returned a worse time then getHackTime() for ' + server.hostname);
	}
	return hackingTime;
}

/** evalWeakenTime -> https://github.com/danielyxie/bitburner/blob/dev/src/Hacking.ts
	* @param {Object} server
	* @param {Object} player
	* @return {number} weaken time in seconds
	*/
export function evalWeakenTime(server, player) {
	const weakenTimeMultiplier = 4; // Relative to hackingTime
	return weakenTimeMultiplier * evalHackingTime(server, player);
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

/** realVectors: calculates the number of (W)GWHW threads
  * @param {NS} ns
  * @param {Object} server - server class object
  * @param {number} maxThreads - max number of available threads
  * @returns {Vectors} calculated attack vectors
  */
/** only used for real world deployment */
// TODO: incorport using formulas.exe to get more actrite numbers
export function realVectors(ns, server, maxThreads) {

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
		shouldPrimeStr: false,
		shouldPrimeMoney: false,
  }

  //Primary Weaken: only done if !isPrimedStr
  if(!server.isPrimedStr) {
    let currentDifficulty = ns.getServerSecurityLevel(server.hostname); //get current security level
    let targetPrimeWeakens = Math.ceil((currentDifficulty - server.minDifficulty)/weakenRate); //calc totale needed weaken threads
    vectors.primeWeaken = Math.min(targetPrimeWeakens, maxThreads); //stay inside available threads
    vectors.totalVectors = vectors.primeWeaken; //update total vectors
    maxThreads -= vectors.totalVectors; //reduce maxThreads
    if (vectors.primeWeaken == targetPrimeWeakens) {vectors.shouldPrimeStr = true;} //setting the isPrimedStr flag to true
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
    if (server.isPrimedMoney) { //on isPrimedMoney get min growth
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
      logger(ns, 'WARNING: Scaling down the growth threads for '+ server.hostname, 0);
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
			vectors.growWeakens == targetgrowWeakens) {
				// TODO: should be moved to completed deployments
				vectors.shouldPrimeMoney = true; //set the isPrimedMoney flag if was false, not bypassed & needed threads are allocated
    }

    //Calc hack() and matching weaken()
    //continue if there is a min of 2 threads (one each for HW) && target server is fully primed
    //or if a dryrun
    if (maxThreads > 2 &&
			(server.isPrimedMoney || vectors.shouldPrimeMoney) &&
			(server.isPrimedStr || vectors.shouldPrimeStr)) {

      //calc number of hack() threads needed to steal takePercent of server money
      let targetHackThreads = Math.ceil(server.takePercent/server.percentPerSingleHack);
      let targethackWeakens = Math.ceil(targetHackThreads*hackRate/weakenRate);

      //adjust the hack()s + weaken()s count to inside the maxThreads limit if needed
      if (targetHackThreads + targethackWeakens > maxThreads) {
        logger(ns, 'WARNING: Scaling down the hack threads for ' + server.hostname, 0);
        //Math says that for every 25 hack()s you need 1 weaken() => groups of 26
        let numGroups = Math.floor(maxThreads/26);
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
	/** Error Handling */
	//invalid vectors
	for (let i in vectors) {
		if (isNaN(vectors[i]) || vectors[i] == null) {
			throw new Error(server.hostname + ' has an invalid vector result in ' + i + ': ' + JSON.stringify(vectors));
		}
	}
	//count mismatch
	let count = vectors.primeWeaken + vectors.growThreads + vectors.growWeakens + vectors.hackThreads + vectors.hackWeakens;
	if ( count != vectors.totalVectors) {
		throw new Error(server.hostname + ' has a vector count mismatch. Counted ' + count + ' totalVectors: ' + vectors.totalVectors);
	}

  return vectors;
}// end of realVectors

/** deployVectors: deploys attack vectors across the drone network
	* @param {ns} ns
	* @param {Server} target - target to be attacked
	* @param {array} drones - drones to be used
	* @param {number} usableThreads - usable threads
	* @param {number} usableScripts - usable scripts
	* @param {array} fileNames - files to be deployed
	* @param {string} cycleBatch - cycle/batch # to pass as arg to deployed scripts
	* @return {boolean} results.successful
	* @return {number} results.deployedScripts
	* @return {array} results.pids
	*/
export function deployVectors(ns, target, drones, usableThreads, usableScripts, fileNames, cycleBatch) {
	/** Setup */
	// OPTIMIZE: check the deployments on home server and see if that reduces needed threads due to core upgrades (weakens and grows)
	//Files
	let weakenFile = fileNames[0];
	let growFile = fileNames[1];
	let hackFile = fileNames[2];
	//Timing
	// TODO: adjust this section to account to hitting a primed target with Formulas.exe
	let weakenTime = ns.getWeakenTime(target.hostname);
	let growTime = ns.getGrowTime(target.hostname);
	let hackTime = ns.getHackTime(target.hostname);
	let stageTwoDelay = weakenTime + baseDelay - growTime;
	let stageThreeDelay = baseDelay * 2;
	let stageFourDelay = baseDelay * 3 + weakenTime - hackTime;
	let stageFiveDelay = baseDelay * 4;
	//Vectors
	let vectors = target.realVectorsPerBatch(usableThreads);
	//Control Tacking
	let successful = false;
	let oldUsableScripts = usableScripts;
	let pids = [];

	/** Deployment controls
		* (W)GWHW from vectors
		*/
	// (W) threads
	if (vectors.primeWeaken > 0 && usableScripts > 0) { //if we need to prime the strength
		let pwlocalResults = macroDeploy(ns, drones, weakenFile, target.hostname, vectors.primeWeaken, 0 , cycleBatch)
		if (!pwlocalResults.successful) {
			logger(ns, 'WARNING: Could not deploy all Primary Weaken()s against ' + target.hostname, 0);
			successful = false;
		} else {
			successful = true;
			if (vectors.shouldPrimeStr) { //if deploying all of the primeWeaken threads should get the target to primed, set flag
				target.isPrimedStr = true;
			}
		}
		usableScripts -= pwlocalResults.deployedScripts;
		pids.push(...pwlocalResults.pids);
	}// end of (W) threads

	// GW threads
	if (vectors.growThreads > 0 && (target.isPrimedStr && usableScripts > 0)) {//if we need to grow and target strength is primed
		//Deploy the growWeakens first
		let gwlocalResults = macroDeploy(ns, drones, weakenFile, target.hostname, vectors.growWeakens, stageThreeDelay, cycleBatch)
		if (!gwlocalResults.successful) {
			logger(ns, 'WARNING: Could not deploy all growWeaken()s agianst ' + target.hostname, 0);
			successful = false;
		} else {
			successful = true;
		}
		usableScripts -= gwlocalResults.deployedScripts;
		pids.push(...gwlocalResults.pids);

		//Deploy the grows
		let glocalResults = macroDeploy(ns, drones, growFile, target.hostname, vectors.growThreads, stageTwoDelay, cycleBatch)
		if (vectors.growThreads > 0 && successful && usableScripts > 0) {
			if (!glocalResults.successful) {
				logger(ns, 'WARNING: Could not deploy all Grow()s against ' + target.hostname, 0);
				successful = false;
			} else {
				successful = true;

				if (vectors.shouldPrimeMoney) { //if deploying all of the growThreads should get the target's money primed, set  flag
					target.isPrimedMoney = true;
				}
			}
			usableScripts -= glocalResults.deployedScripts;
			pids.push(...glocalResults.pids);
		}
	}//end of GW Threads

	// HW threads
	if (vectors.hackThreads > 0 && target.isPrimedMoney && usableScripts) {
		//deploy the hackWeakens first
		let hwlocalResults = macroDeploy(ns, drones, weakenFile, target.hostname, vectors.hackWeakens, stageFiveDelay, cycleBatch)
		if (!hwlocalResults.successful) {
			logger(ns, 'WARNING: Could not deploy all hackWeaken()s against ' + target.hostname, 0);
			successful = false;
		} else {
			successful = true;
		}
		usableScripts -= hwlocalResults.deployedScripts;
		pids.push(...hwlocalResults.pids);

		//Deploy the hacks
		let hlocalResults = macroDeploy(ns, drones, hackFile, target.hostname, vectors.hackThreads, stageFourDelay, cycleBatch)
		if (!hlocalResults.successful) {
			logger(ns, 'WARNING: Could not deploy all Hack()s agianst ' + target.hostname, 0);
			successful = false;
		} else {
			successful = true;
		}
		usableScripts -= hlocalResults.deployedScripts;
		pids.push(...hlocalResults.pids);
	}

	//Error handling
	if (pids.includes(0)) {
		throw new Error('Ended up with a 0 for a pid in deployVectors trying to deploy ' + vectors.totalVectors + ' vectors against ' + target.hostname);
	}

	let deployedThreads = 0;
	pids.forEach(pid => deployedThreads += ns.getRunningScript(pid).threads)
	if (deployedThreads > vectors.totalVectors) {
		throw new Error('Deployed more Threads than expected: ' + vectors.totalVectors + ' vs ' + deployedThreads + ' against ' + target.hostname);
	}


	//results
	let results = {
		successful: successful,
		deployedScripts: oldUsableScripts - usableScripts,
		batchTime: weakenTime + stageFiveDelay,
		vectors: vectors,
		pids: pids,
	}
	return results;
}//end of deployVectors

/** macroDeploy: deploys a single file against a single target on all drones until x threads have been deployed
	* @param {NS} ns
	* @param {array} drones
	* @param {string} script
	* @param {string} target - hostname
	* @param {number} threads
	* @param {number} waitTime
	* @param {string} cycleBatch
	* @return {boolean} results.successful
	* @return {number} results.deployedScripts
	* @return {array} results.pids
	*/
function macroDeploy(ns, drones, script, target, threads, waitTime, cycleBatch) {

	//setup
	let neededRam = ns.getScriptRam(script);
	let successful = false;
	let deployedScripts = 0;
	let plannedThreads = threads

	//deploy loop
	let i = 0;
	let pids = [];
	while (!successful && i < drones.length) {
		let currentDrone = drones[i];
		let currentAvailableThreads = Math.floor(currentDrone.ramAvailable/neededRam);
		let deployableThreads = Math.min(threads, currentAvailableThreads);
		if (deployableThreads > 0) {
			let result = microDeploy(ns, currentDrone.hostname, script, target, deployableThreads, waitTime, cycleBatch);
			if (result > 0) {
				pids.push(result)
				threads -= deployableThreads;
				deployedScripts += 1;
				if (threads <= 0) {
					successful = true;
				}
			}
		}
		i++;
	}
	//Error handling
	if (pids.length != deployedScripts) {
		throw new Error('PIDs vs deployedScripts mismatch: Expected ' + deployedScripts + ' got ' + pids.length + ' agianst ' + target);
	}

	let deployedThreads = 0;
	pids.forEach(pid => deployedThreads += ns.getRunningScript(pid).threads)
	if (deployedThreads > plannedThreads) {
		throw new Error('Deployed more Threads than expected: ' + plannedThreads + ' vs ' + deployedThreads + ' against ' + target);
	}
	let results = {
		successful: successful,
		deployedScripts: deployedScripts,
		pids: pids,
	}
	return results;
}//end of macroDeploy

/** microDeploy: deploys a single script on a single drone with x threads against a single target
	* @param {NS} ns
	* @param {string} drone - hostname
	* @param {string} script
	* @param {string} target - hostname
	* @param {number} threads
	* @param {number} waitTime
	* @param {string} cycleBatch
	* @return {number} PID of deployed script
	*/
function microDeploy(ns, drone, script, target, threads, waitTime, cycleBatch) {
	let result = ns.exec(script, drone, threads, target, waitTime, cycleBatch);
	if (!result){
		throw new Error('Failed to deploy ' + script + ' on ' + drone + ' against ' + target);
	}
	return result;
}//end of microDeploy

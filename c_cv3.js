/**
 * Main Command and Control v3
 *
 * This will read the inventory from the inventory.txt file
 * It will then evaluate the current status of the selected best Target
 * It will attempt to plot best allocation of weaken, grow, and hack thread
 * It will then activate those threads on the aviabile drone assets
 */

//checks to see if file exsits
function can(ns, file) {
	return ns.fileExists(file, "home");
}

/** microDeploy: deploys a single script on a drone with x threads against a target
 * @param {ns} ns
 * @param {string} drone hostname
 * @param {string} script name
 * @param {string} target hostname
 * @param {number} threads
 * @param {number} milliseconds to pass to the script
 */
function microDeploy(ns, drone, script, target, threads, delayStartTime, cyclenumber) {

  ns.exec(script, drone, threads, target, delayStartTime, cyclenumber);

}

/** macroDeploy: deploys a single script on all drones until it has deployed x threads against a target
 * @param {ns} ns
 * @param {array} droneNetwork - available drones (rooted with ram, pre loaded with scripts)
 * @parma {number} droneNetwork[i].availableThreads -number of threads per secific drone
 * @param {string} script names
 * @param {string} target hostname
 * @param {number} threads
 * @param {number} milliseconds to pass to the script
 * @returns {boolean} deployed all threads
 */
function macroDeploy(ns, droneNetwork, script, target, threads, delayStartTime, cyclenumber) {

  //get ram usage
  let ramNeeded = ns.getScriptRam(script);
  let completedAllThreads = false;
  let deployableThreads = 0;

  //droneNetwork as array
  let i = 0
  while (!completedAllThreads && i < droneNetwork.length) {
    let currentDrone = droneNetwork[i];
    let droneRam = currentDrone.maxRam - ns.getServerUsedRam(currentDrone.name);
    let currentAvailableThreads = Math.floor(droneRam/ramNeeded);
    deployableThreads = Math.min(threads, currentAvailableThreads);
    if (deployableThreads > 0 ) {
      microDeploy(ns, currentDrone.name, script, target, deployableThreads, delayStartTime, cyclenumber);
      threads -= deployableThreads;
      if (threads <= 0) {
        completedAllThreads = true;
      }
    }
    i++;
  }
  return completedAllThreads;
}


/** deployVectors: deploys attack vectors across the drone network
 * @param {ns} ns
 * @param {string} target - target hostname
 * @param {Object} vectors
 * @param {Object} vectors.weakenThreads
 * @param {number} vectors.weakenThreads.primary
 * @param {number} vectors.weakenThreads.growT
 * @param {number} vectors.weakenThreads.hackT
 * @param {number} vectors.growThreads
 * @param {number} vectors.hackThreads
 * @param {array} droneNetwork - available drones
 * @param {number} droneNetwork[i].availableThreads
 * @param {array} filenames - weaken, grow, hack
 * @param {nubmer} baseDelay - milliseconds between batch launches
 * @returns {number} cycleTime - total cycletime
*/
function deployVectors(ns, target, vectors, droneNetwork, files, baseDelay, cyclenumber) {

	/** notes on timing:
	 * The goal here is to have the primary weakens hit first 	Delay = 0							End = 0 + weakentime
	 * Then to have the Grows all hit next						Delay = 100 + weakentime - growtime	End = 100 + weakentime
	 * Then the weakens that counter the Grows to hit			Delay = 200							End = 200 + weakentime
	 * Then the hacks hit										Delay = 300 + weakentime - hacktime	End = 300 + weakentime
	 * Then the weakens that counter the hacks hit				Delay = 400							End = 400 + weakentime
	 * In theory this will weaken the server to min securtiy, grow the server to max money,
	 * reset the secuirty to min, steal everything, and reset the security to min.
	 * Which means that there should be no need for the primary weakens on the second run
	 * allowing for max grow (to match the succeful hacks) and max hack.
	 *
	 * Game Docs say that it will take between 20 and 200ms to run an excuction.
	 */

	//file setings -->!!!! the ORDER is important!!!!!!
	let weakenfile = files[0];
	let growfile = files[1];
	let hackfile = files[2]
	//timing checks
	let weakentime = ns.getWeakenTime(target);
	//ns.print('Weaken Time is ' + weakentime);
	let growtime = ns.getGrowTime(target);
	let hacktime = ns.getHackTime(target);
	//some results
	let results = [];

	//so for each wP/(gT, g)/(hT, H) batch we will microdeploy as many as we can by cycling through each drone with free ram

	//primary weakens (wP)
	if (vectors.weakenThreads.primary > 0) {
		//deploy primary weakenThreads on droneNetwork
		results[0] = macroDeploy(ns, droneNetwork, weakenfile, target, vectors.weakenThreads.primary, 0, cyclenumber);
	} //end of primary weakens

	//calculate the delay for the next cycle
	let stageTwoDelay = weakentime + baseDelay - growtime; //should work out to when the delay needed to get the next stage to END baseDelay time after the last
	let stageThreeDelay = baseDelay * 2;
	let stageFourDelay = baseDelay * 3 + weakentime - hacktime;
	let stageFiveDelay = baseDelay * 4
	//note: the actual code is going to cue as 3,2,5,4 not 2,3,4,5 - this is so the target will over weaken if there are not enough threads for the action
	//grow weakens and grows (gT, g)
	if (vectors.growThreads > 0) {
		//deploy the weakens
		results[1] = macroDeploy(ns, droneNetwork, weakenfile, target, vectors.weakenThreads.growT, stageThreeDelay, cyclenumber);

		//delpoy the grows
		results[2] = macroDeploy(ns, droneNetwork, growfile, target, vectors.growThreads, stageTwoDelay, cyclenumber);
	} //end of gT, g

	//hacking time!!! (hT, h)
	if (vectors.hackThreads > 0) {
		//deploy the weakens
		results[3] = macroDeploy(ns, droneNetwork, weakenfile, target, vectors.weakenThreads.hackT, stageFiveDelay, cyclenumber);

		//deploy the hacks
		results[4] = macroDeploy(ns, droneNetwork, hackfile, target, vectors.hackThreads, stageFourDelay, cyclenumber);
	} //end of hT, h

	if (!results.every((value) => value === true)) {
		ns.print("Error deploying all threads for " + target + " Vectors: " + vectors + " Completed: " + results);
	}

	let cycletime = stageFiveDelay + weakentime;
	return cycletime;
}


/** evalVectors: returns number of threads for each weaken, grow, and hack
 * @param {ns} ns
 * @param {Object} target
 * @param {string} target.name
 * @param {number} target.minSecurity
 * @param {number} target.maxMoney
 * @param {number} max usable threads
 * @param {number} takePercent
 * @returns {object} returns
 * @returns {object} returns.target
 * @returns {boolean} returns.target.isPrimedMoney
 * @returns {boolean} retruns.target.isPrimedStr
 * @returns {Object} returns.vectors
 * @returns {Object} returns.vectors.weakenThreads
 * @returns {number} vectors.weakenThreads.primary
 * @returns {number} vectors.weakenThreads.growT
 * @returns {number} vectors.weakenThreads.hackT
 * @returns {number} vectors.growThreads
 * @returns {number} vectors.hackThreads
 */
function evalVectors(ns, target, maxThreads, takePercent) {
	const weakenRate = 0.05;
	const growRate = 0.004;
	const hackRate = 0.002;
	var weakenThreads = {
		primary: 0,
		growT: 0,
		hackT: 0,
	}

	var vectors = {
		weakenThreads: weakenThreads,
		growThreads: 0,
		hackThreads: 0,
		totalVectors: 0,
	}
	let availableThreads = maxThreads;

	if (!target.isPrimedStr) {
		//current Security Level
		let currentSecurityLevel = ns.getServerSecurityLevel(target.name);
		//number of intial weaken threads needed
		let targetWeakenThreads = Math.ceil((currentSecurityLevel - target.minSecurity) / weakenRate);
		//make sure not to go over maxThreads
		vectors.weakenThreads.primary = Math.min(targetWeakenThreads, maxThreads);
		//adjust number of available threads
		availableThreads -= vectors.weakenThreads.primary;
		//running total
		vectors.totalVectors = vectors.weakenThreads.primary;
		if (vectors.weakenThreads.primary == targetWeakenThreads) {
			target.isPrimedStr = true; //sets isPrimed when the number of asked threads = number of needed
		}
	}

	//try to add in grows and their weakens
	if (availableThreads > 0) {
		//calculate the number of needed grow threads
		let growMultiplier = 0;
		let targetedGrowthThreads = 0;
		let strengthenAmount = 0;
		let additionalWeakens = 0;
		//adjustment for when there is 0 on the target --> game docs add 1 to grow so
		let availableMoney = Math.max(ns.getServerMoneyAvailable(target.name), 1);

		if (!target.isPrimedMoney) {
			//if the target has not been primed for money
			growMultiplier = target.maxMoney/availableMoney;
			targetedGrowthThreads = Math.ceil(ns.growthAnalyze(target.name, growMultiplier));
			strengthenAmount = targetedGrowthThreads * growRate;
			additionalWeakens = Math.ceil(strengthenAmount/weakenRate);
			if ((availableThreads-additionalWeakens-targetedGrowthThreads) > 0) {
				target.isPrimedMoney = true;
			}
		} else {
			//if the target has been primed for money
			growMultiplier = target.maxMoney / (target.maxMoney * (1 - takePercent));
			targetedGrowthThreads = Math.ceil(ns.growthAnalyze(target.name, growMultiplier));
			strengthenAmount = targetedGrowthThreads * growRate;
			additionalWeakens = Math.ceil(strengthenAmount/weakenRate);
		}

		//make sure not to go over available threads
		additionalWeakens = Math.min(additionalWeakens, availableThreads);
		//add in the additionalWeakens
		vectors.weakenThreads.growT = additionalWeakens;
		//adjust availableThreads
		availableThreads -= additionalWeakens;
		//running total
		vectors.totalVectors += vectors.weakenThreads.growT;
		//make sure to not go over the available threads
		let actuallGrowthThreads = Math.min(targetedGrowthThreads, availableThreads);
		//adjust number of available threads
		availableThreads -= actuallGrowthThreads;
		//set the number of vector.growthThreads
		vectors.growThreads = actuallGrowthThreads;
		//running total
		vectors.totalVectors += vectors.growThreads;

		//reset strengthen and weaken
		strengthenAmount = 0;
		additionalWeakens = 0;

		//try to add in hacks and their weakens
		if (availableThreads > 0 && (actuallGrowthThreads == targetedGrowthThreads)) {
			//precent stolen per hack thread
			let singlethreadpercent = ns.hackAnalyze(target.name);
			//number of threads needed to take %
			let targetedHackThreads = takePercent / singlethreadpercent;
			//increase the number of hacking threads by the lossed due to chance
			targetedHackThreads = Math.ceil(targetedHackThreads / (ns.hackAnalyzeChance(target.name)));
			//calcualte needed weaken threads
			strengthenAmount = targetedHackThreads * hackRate;
			additionalWeakens = Math.ceil(strengthenAmount / weakenRate);
			//make sure to not go ove the available threads
			additionalWeakens = Math.min(additionalWeakens, availableThreads);
			//check to make sure we can do both the needed hacks and their covers
			//there might be an issue with the take 1% math bit.....idk...
			//this should help cover it....
			if (additionalWeakens + targetedHackThreads <= availableThreads) {
				//add in the weakens
				vectors.weakenThreads.hackT = additionalWeakens;
				//running total
				vectors.totalVectors += vectors.weakenThreads.hackT;
				//adjust the number of aviable threads
				availableThreads -= additionalWeakens;
				//make sure not to go over the available threads
				targetedHackThreads = Math.min(targetedHackThreads, availableThreads);
				//add into vector
				vectors.hackThreads = targetedHackThreads;
				//running total
				vectors.totalVectors += vectors.hackThreads;
			}

		}
	}
	return {vectors: vectors, target: target,};
}

/** @param {NS} ns */
export async function main(ns) {
	//initalization test for the exsitance of the inventory.txt file
	if (!ns.fileExists('inventoryv2.txt')) {
		ns.tprint('inventoryv2.txt does not exist, calling spider.js to restart inventory cycle');
		ns.spawn('spiderv2.js');
	} else {
		//quite some logs
		//ns.disableLog('sleep');
		ns.disableLog('exec');
		ns.disableLog('getServerUsedRam');
		ns.disableLog('getServerMoneyAvailable');
		ns.disableLog('getServerSecurityLevel');
		ns.disableLog('getHackingLevel');
		ns.disableLog('getServerNumPortsRequired');

		//load JSON and parse informaton
		let inventory = JSON.parse(ns.read('inventoryv2.txt'));
		let droneNetwork = inventory.targets.filter(obj => { return obj.maxRam >= 2;});
		droneNetwork.sort((a,b) => {return b.maxRam - a.maxRam;});
		let targets = inventory.targets.filter(obj => {return obj.maxMoney != 0;});
		let numberOfDrones = droneNetwork.length;
		let numberOfTargets = targets.length;

		//Terminal Output
		ns.tprint('Launching Command and Control, loaded inventoryv2.txt');
		ns.tprint("Primary Target: " + targets[0].name + "(" + numberOfTargets + ") Best drone: " + droneNetwork[0].name + "(" + numberOfDrones +")");

		//while true loop
		//cycle info
		let cycle = 1;
		let baseDelay = 200;
		let sleepTime = baseDelay;

		while (true) {
			//Log Outut
			ns.print("Cycle #" + cycle);

			/** Iterive Target Handling */
			//set index
			let i = 0;
			//set usable threads
			let usableThreads = inventory.maxThreads;
			//loop while there are tragets and usable Threads
			while (i < numberOfTargets && usableThreads > 0) {
				//select working target
				let currentTarget = targets[i];
				//get vector info
				let returns = evalVectors(ns, currentTarget, usableThreads, currentTarget.takePercent);
				let vectors = returns.vectors;
				//update target info
				targets[i].isPrimedMoney = returns.target.isPrimedMoney;
				targets[i].isPrimedStr = returns.target.isPrimedStr;
				//deploy vectors
				let batchTime = deployVectors(ns, currentTarget.name, vectors, droneNetwork, inventory.files, baseDelay, cycle);
				//max number of parralel cycles
				let maxNumCycles = usableThreads / vectors.totalVectors;
				//set theoretical delay
				let theoryTime = batchTime/maxNumCycles;
				//get actual delay
				let actTime = Math.max(theoryTime, baseDelay);
				//modify the wait if on the first index item
				if (i == 0 ) {
					sleepTime = actTime;
				}

				//calc reserve threads
				let reserveThreads = Math.ceil(batchTime/actTime*vectors.totalVectors);
				if (reserveThreads > currentTarget.cycleThreads) {
					ns.print("Reserve Threads per c_cv3 not as expected. Expected: " + currentTarget.cycleThreads + " Got: " + reserveThreads);
					ns.print("isMoneyPrimed: " + currentTarget.isPrimedMoney + " isPrimedStr: " + currentTarget.isPrimedStr);
					ns.print(JSON.stringify(vectors));
				}
				//log output
				ns.print("Target: " + currentTarget.name + " Hacks/Vectors/Reserve/Usable: " + vectors.hackThreads + '/' + vectors.totalVectors + '/' + reserveThreads + '/' + usableThreads);
				//adjust usable threads
				usableThreads -= reserveThreads;
				i++;
			}

			//Check if more servers are hackable
      		if (inventory.otherservers.length > 0 ){
  				if (ns.getHackingLevel() > inventory.otherservers[0].requiredHack) {
					let ports = 0;
					if (can(ns, "brutessh.exe")) { ++ports; }
					if (can(ns, "ftpcrack.exe")) { ++ports; }
					if (can(ns, "relaysmtp.exe")) { ++ports; }
					if (can(ns, "httpworm.exe")) { ++ports; }
					if (can(ns, "sqlinject.exe")) { ++ports; }
					if (ports >= ns.getServerNumPortsRequired(inventory.otherServers[0].name)) {
						ns.tprint('Can gain root on new server: ' + inventory.otherServers[0].name + ' Terminating C&C and Re-running spider.js');
						ns.print('Can gain root on new server: ' + inventory.otherServers[0].name + ' Terminating C&C and Re-running spider.js');
						ns.spawn('spiderv2.js');
					}
        		}
			}
			//Log output

			ns.print("Waiting: " + sleepTime/1000 + " Secs");
			await ns.sleep(sleepTime);
			cycle++;
		}
	}
}

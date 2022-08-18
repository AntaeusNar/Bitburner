/** Just a collection of importable helper functions
 * note, please import as objects, NOT as *, think of the ram....
 */

 /** Checks to see if a file exsits on the home server
  * @param {ns} ns
  * @param {string} filename
  * @returns {boolean} true if exsits
  */
 export function can(ns, file) {
  	return ns.fileExists(file, "home");
  }


/** Given a server object and a takePercent, will calculate the ratio
 * in $/GB/Sec
 * @param {ns} ns
 * @param {object} server
 * @param {number} neededRam - GB of ram per thread
 * @param {number} takePercent - as a decimal
 * @param {boolean} haveFormules - have Formules.exe
 * @returns {Object} returns
 * @returns {number} returns.ration - $/GB/Sec
 * @returns {number} returns.cycleThreads - threads for a full cycle
 */
export function getRatio(ns, server, neededRam, takePercent, haveFormules = false) {
  let ratio = 0;
  let cycleThreads = 0;

  if (haveFormules) {

  } else {
    //calc batch time in sec
    let totalTime = (ns.getWeakenTime(server.hostname) + 500)/1000;

    //calc target amount of money
    let targetHackMoney = server.moneyMax*takePercent;

    //calculate GB needed to hack/weak/grow targetHackMoney
  	let moneyPerSingleHack = ns.hackAnalyze(server.hostname)/ns.hackAnalyzeChance(server.hostname)*server.moneyMax;
  	let numHackThreads = Math.ceil(targetHackMoney/moneyPerSingleHack);
  	let growMultipler = 1/(1-takePercent);
  	let numGrowThreads = Math.ceil(ns.growthAnalyze(server.hostname, growMultipler));
  	let numWeakenThreads = Math.ceil(numGrowThreads*.004/.05);
  	numWeakenThreads += Math.ceil(numHackThreads*.002/.05);
  	let totalThreads = numHackThreads+numGrowThreads+numWeakenThreads;
  	let neededGB = totalThreads*neededRam;
  	cycleThreads = Math.ceil((totalTime*1000)/200*totalThreads);

    //calc ratio
  	ratio = Math.floor(targetHackMoney/neededGB/totalTime*100)/100;
    if (isNaN(ratio) || ratio == 0){
      ratio = null;
      ns.print("Ratio for "+ server.hostname+ " is NaN: $" + targetHackMoney
        + " " +totalThreads + " Threads " + neededRam + " GB per Thread "+ neededGB + " GB " + totalTime +" sec.");
    }
  }
  let returns = {
		ratio: ratio,
		cycleThreads: cycleThreads,
	}
	return returns;
}

/** Given a server object, max usable threads, and a take percentage will calculate the needed threads for a single batch
 * @param {ns} ns
 * @param {object} server - full server object
 * @param {number} maxThreads - maximum usable threads
 * @param {number} takePercent - targeted take percentage
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
 		let currentSecurityLevel = ns.getServerSecurityLevel(target.hostname);
 		//number of intial weaken threads needed
 		let targetWeakenThreads = Math.ceil((currentSecurityLevel - target.minDifficulty) / weakenRate);
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
 		let availableMoney = Math.max(ns.getServerMoneyAvailable(target.hostname), 1);

 		if (!target.isPrimedMoney) {
 			//if the target has not been primed for money
 			growMultiplier = target.moneyMax/availableMoney;
 			targetedGrowthThreads = Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier));
 			strengthenAmount = targetedGrowthThreads * growRate;
 			additionalWeakens = Math.ceil(strengthenAmount/weakenRate);
 			if ((availableThreads-additionalWeakens-targetedGrowthThreads) > 0) {
 				target.isPrimedMoney = true;
 			}
 		} else {
 			//if the target has been primed for money
 			growMultiplier = target.moneyMax / (target.moneyMax * (1 - takePercent));
 			targetedGrowthThreads = Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier));
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
 			let singlethreadpercent = ns.hackAnalyze(target.hostname);
 			//number of threads needed to take %
 			let targetedHackThreads = takePercent / singlethreadpercent;
 			//increase the number of hacking threads by the lossed due to chance
 			targetedHackThreads = Math.ceil(targetedHackThreads / (ns.hackAnalyzeChance(target.hostname)));
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

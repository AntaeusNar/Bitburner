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

 /** Given a server object, will attempt to gain root
  * @param {ns} ns
  * @param {object} server
  * @returns {boolean} result
  */
 export function getRoot(ns, target) {
  	let result = false;
  	let ports = 0;
  		if (can(ns, "brutessh.exe")) { ns.brutessh(target.hostname); ++ports; }
  		if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(target.hostname); ++ports; }
  		if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(target.hostname); ++ports; }
  		if (can(ns, "httpworm.exe")) { ns.httpworm(target.hostname); ++ports; }
  		if (can(ns, "sqlinject.exe")) { ns.sqlinject(target.hostname); ++ports; }
  		if (ports >= target.numOpenPortsRequired) {
  			ns.nuke(target.hostname);
  			if (ns.hasRootAccess(target.hostname)){
  				result = true;
  			}
  		}
  	return result;
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
 export function evalVectors(ns, server, maxThreads, takePercent) {
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

   //Primary Weakens
   if (!server.isPrimedStr) {
 		//current Security Level
 		let currentSecurityLevel = ns.getServerSecurityLevel(server.hostname);
 		//number of intial weaken threads needed
 		let targetWeakenThreads = Math.ceil((currentSecurityLevel - server.minSecurity) / weakenRate);
 		//make sure not to go over maxThreads
 		vectors.weakenThreads.primary = Math.min(targetWeakenThreads, maxThreads);
 		//adjust number of available threads
 		availableThreads -= vectors.weakenThreads.primary;
 		//running total
 		vectors.totalVectors = vectors.weakenThreads.primary;
 		if (vectors.weakenThreads.primary == targetWeakenThreads) {
 			server.isPrimedStr = true; //sets isPrimed when the number of asked threads = number of needed
 		}
 	}
 }

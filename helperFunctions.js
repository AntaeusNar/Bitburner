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
  	if (target.requiredHackingSkill <= ns.getHackingLevel()) {
  		if (can(ns, "brutessh.exe")) { ns.brutessh(target.hostname); ++ports; }
  		if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(target.hostname); ++ports; }
  		if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(target.hostname); ++ports; }
  		if (can(ns, "httpworm.exe")) { ns.httpworm(target.hostname); ++ports; }
  		if (can(ns, "sqlinject.exe")) { ns.sqlinject(target.hostname); ++ports; }
  		if (ports >= target.numOpenPortsRequired) {
  			ns.nuke(target.hostname);
  			if (target.hasAdminRights){
  				result = true;
  			}
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

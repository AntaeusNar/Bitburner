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
  * @returns {Vectors} calculated attack vectors
  */
export function evalVectors(ns, server, maxThreads = Infinity) {
  /**This function will be used several times:
    *once for inital ratio at defaults (1% Take and Infinity threads)
    *once for adjusting the take to optimal (increasing Take and Infinity threads)
    *once for actual deployment (optimal take and real threads)
    *When doing inital and adjusting take to optimal, the option to use formulas.exe should also exsits
    */

  //some setup
  const weakenRate = .05;
  const growRate = .004;
  const hackRate = .002;
  var vectors = {
    totalVectors: 0,
    primeWeaken: 0,
    growThreads: 0,
    growWeakens: 0,
    hackThreads: 0,
    hackWeakens: 0
  }

  //Calc primary Weakens: Only done if for actual deployment && server is not weaken()ed to min
  if(!server.isPrimedStr && isFinite(maxThreads)) {
    server.hackDifficulty = ns.getServerSecurityLevel(server.hostname); //get current security level
    let targetPrimeWeakens = Math.ceil((server.hackDifficulty - server.minDifficulty)/weakenRate); //calc totale needed weaken threads
    vectors.primeWeaken = Math.min(targetPrimeWeakens, maxThreads); //stay inside available threads
    vectors.totalVectors = vectors.primeWeaken; //update total vectors
    maxThreads -= vectors.totalVectors; //reduce maxThreads
    if (vectors.primeWeaken == targetPrimeWeakens) {server.isPrimedStr = true;} //setting the isPrimedStr flag to true
  }

  //Calc grow() and matching weaken()s
  if (maxThreads > 0) {
    //setup
    let growthMultiplier = 0;
    let targetGrowThreads = 0;
    let targetgrowWeakens = 0;
    let growBypass = false;

    //calc growthMultiplier
    if (!server.isPrimedMoney && isFinite(maxThreads)) { //Only for actual deployment && server is not grow()n to max
      growthMultiplier = server.moneyMax/server.moneyAvailable;
    } else { //for initial ratio, optimal take, & actual deployment when server is grow()n to max
      growthMultiplier = server.moneyMax/(server.moneyMax * (1 - server.takePercent));
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
      vectors.growThreads == targetGrowThreads && vectors.growWeakens == targetgrowWeakens) {
        server.isPrimedMoney = true; //set the isPrimedMoney flag if was false, not bypassed & needed threads are allocated
    }

    //calc hack()s and matching weaken()s
    if (maxThreads > 0 && server.isPrimedMoney && server.isPrimedStr) { //if there are available Threads and the server is fully primed

      //calc number of hack() threads needed to steal takePercent of server money
      let percentPerSingleHack = null;
      if (server.formPercentPerSingleHack != null) {
        percentPerSingleHack = server.formPercentPerSingleHack;
      } else {
        percentPerSingleHack = server.percentPerSingleHack;
      }
      let targetHackThreads = Math.ceil(server.takePercent/percentPerSingleHack);
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
      maxThreads -= vectors.hackthreads; //reduce maxThreads
      vectors.hackWeakens = Math.min(targethackWeakens, maxThreads); //stay inside maxThreads
      vectors.totalVectors += vectors.hackWeakens; //update total vectors
      maxThreads -= vectors.hackWeakens; //reduce maxThreads
    }

  }
  return vectors;
}

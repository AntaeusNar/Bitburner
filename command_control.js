/** Command and Control Master script
  * Version 1
  * Derived from c_cv3 and spiderv2
  *
  * This script will control network focused hacking efforts
  */

 /** Helper Type Functions */

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

/** Checks for existance of file on the spesified or home server
  * @param {NS} ns
  * @param {string} file - File Name
  * @param {string} [serverName=home] - hostname of server
  * @return {boolean} true if file exists on the server
  */
export function can(ns, file, serverName='home') {
	return ns.fileExists(file, serverName);
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

/** Will attempt to gain root on server
  * @param {NS} ns
  * @param {string} serverName - hostname of server
  * @return {boolean} true if root was sucessful
  */
export function getRoot(ns, serverName) {
  let result = false;
	let ports = 0;
	if (can(ns, "brutessh.exe")) { ns.brutessh(target); ++ports; }
	if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(target); ++ports; }
	if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(target); ++ports; }
	if (can(ns, "httpworm.exe")) { ns.httpworm(target); ++ports; }
	if (can(ns, "sqlinject.exe")) { ns.sqlinject(target); ++ports; }
	if (ports >= ns.getServerNumPortsRequired(target)) {
		ns.nuke(target);
		if (ns.hasRootAccess(target)){
			result = true;
		}

	}
	return result;
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
  * @param {number} [takePercent=.01] - % of Server Max money targeted
  * @param {number} [maxThreads=Infinity] - max number of available threads
  * @returns {Vectors} calculated attack vectors
  */
function evalVectors(ns, server, takePercent = .01, maxThreads = Infinity) {
  /**This function will be used 3 seperate times:
    *once for inital ratio at defaults (1% Take and Infinity threads)
    *once for adjusting the take to optimal (increasing Take and Infinity threads)
    *once for actual deployment (optimal take and real threads)
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
      growthMultiplier = server.moneyMax/(server.moneyMax * (1 - takePercent));
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
      let targetHackThreads = Math.ceil(takePercent/server.percentPerSingleHack);
      let targethackWeakens = Math.ceil(targetHackThreads*hackRate/weakenRate);

      //adjust the hack()s + weaken()s count to inside the maxThreads limit if needed
      if (targetHackThreads + targethackWeakens > maxThreads) {
        logger(ns, 'WARNING: Scaling down the hack threads for ' + server.hostname);
        //Math says that for every 25 hack()s you need 1 weaken() => groups of 26
        numGroups = Math.floor(maxThreads/26);
        targetHackThreads = numGroups*25;
        targethackWeakens = numGroups;
      }

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

/** Class repesenting a server */
class Server {

  /** Creates Server object duplicating the structure of ns.getServer(hostname)
    * @param {NS} ns
    * @param {string} hostname
    */
  constructor(ns, hostname){
    if (typeof(hostname) !== 'string') {throw new Error('Hostname for server class must be a string.')};
    logger(ns, 'INFO: Building class for ' + hostname, 0);
    this.hostname = hostname;
    this.ns = ns;
    //reserve some ram if this is home
    if (this.hostname == 'home') {
      this.maxRam = this.ns.getServerMaxRam(this.hostname) - 32;
    } else {
      this.maxRam = this.ns.getServerMaxRam(this.hostname);
    }
    this.minDifficulty = this.ns.getServerMinSecurityLevel(this.hostname);
    this.moneyMax = this.ns.getServerMaxMoney(this.hostname);
    this.numOpenPortsRequired = this.ns.getServerNumPortsRequired(this.hostname);
    this.requiredHackingSkill = this.ns.getServerRequiredHackingLevel(this.hostname);
    this.isTarget = false;
    if (this.moneyMax > 0 && this.hostname != 'home') {this.isTarget = true; this.takePercent=.001}
    this.isPrimedStr = false;
    this.isPrimedMoney = false;
    this.isDrone = false;
    if (this.maxRam > 0 ) {this.isDrone = true}
    this.update();
  }

  /** Updates changing serve API information */
  update() {
    this.hackDifficulty = this.ns.getServerSecurityLevel(this.hostname);
    this.hasAdminRights = this.ns.hasRootAccess(this.hostname);
    this.moneyAvailable = Math.max(this.ns.getServerMoneyAvailable(this.hostname),1); //set to actual money or 1 whichever is greater
    this.ramUsed = this.ns.getServerUsedRam(this.hostname);
    this.weakenTime = this.ns.getWeakenTime(this.hostname);
    this.hackAnalyze = this.ns.hackAnalyze(this.hostname);
    this.hackAnalyzeChance = this.ns.hackAnalyzeChance(this.hostname);
    this.calc();
  }

  /** Updates changing calculated information */
  calc() {
    this.ramAvailable = this.maxRam - this.ramUsed;
    this.percentPerSingleHack = this.hackAnalyze*this.hackAnalyzeChance
    this.ratioCalc()
  }

  /** Calculates the ratio */
  ratioCalc() {
    this.ratio = null;
    this.estVectorsPerBatch = null;
    this.batchesPerCycle = null;

    if (!this.isTarget || this.requiredHackingSkill > this.ns.getHackingLevel()) {
      //If this server is not a target or not currenttly hackable then we dont worry about it at all
    } else {

      //calc the current batch length in secs (weakentime)
      let batchTime = (this.weakenTime + 800)/1000;
      this.batchesPerCycle = Math.floor(batchTime*1000/200);

      //calc how much money the takePercent should take
      let targetTake = this.moneyMax*this.takePercent;

      this.estVectorsPerBatch = evalVectors(this.ns, this).totalVectors;

      this.ratio = Math.floor(targetTake/this.estVectorsPerBatch/batchTime*100)/100;
      if (isNaN(this.ratio)) {
        let message = `Ratio for ${this.hostname} is NaN! targetTake: ${targetTake}, threads: ${this.estVectorsPerBatch}, and batchTime: ${batchTime}`;
        throw new Errror(message);
      }

    }
  }

  /** This static function will adjust the takePercent of an array of Server class objects
    * until array[0].ratio ~= array[1].ratio recusivly.
    * Because increasing the takePercent is a non-linar increase in the number of needed Threads
    * this function will loop the increase
    * In order to prevent a.ratio < b.ratio this will need to stepdown the take after increasing
    * this should prevent overshooting and messingup prioritization.
    * This function will also keep the adjustments under the maxThread limit
    * This will prevent over commitment vs a single target
    * Additionally, the number of vectors per cycle will be caclulated per
    * the number of batches per cycle of the primary target.
    * This ensures that if b can be hit faster then a (lower weakentime)
    * there are not unusable threads reserved as used.
    * @param {array} targets - array of Server class objects
    * @param {number} maxThreads
    * @param {number} [numBatchesPerCycle=0] - the control speed
    * @param {number} [reserveThreads=0] - number of reserved threads
    * @param {number} [indexOfTarget=0] - the current target
    */
  static async adjustTake(targets, maxThreads, numBatchesPerCycle = 0, reserveThreads = 0, indexOfTarget = 0){
    //Basic function setup
    let ns = targets[0].ns;
    let i = indexOfTarget;
    let tempVectorsPerCycle = 0;
    if (i == 0) {
      numBatchesPerCycle = targets[i].batchesPerCycle;
    }


    //run loop while there are threads available, next target available,
    //ratio is greater then next, and takePercent is less the 99%
    while (reserveThreads < maxThreads &&
      i < targets.length &&
      targets[i].ratio >= targets[i+1].ratio &&
      targets[i].takePercent < .99) {
        targets[i].takePercent = Math.round((targets[i].takePercent + .001)*1000)/1000;
        targets[i].ratioCalc();
        tempVectorsPerCycle = numBatchesPerCycle*targets[i].estVectorsPerBatch;
        reserveThreads += tempVectorsPerCycle;
        await ns.sleep(1);
    }

    //back ratio down if ratio has gone over
    if (targets[i].ratio > targets[i+1].ratio) {
      targets[i].takePercent = Math.round((targets[i].takePercent - .001)*1000)/1000;
      targets[i].ratioCalc();
      reserveThreads = reserveThreads - (tempVectorsPerCycle - numBatchesPerCycle*targets[i].estVectorsPerBatch);
    }

    logger(ns, 'INFO: Calculated new take for ' + targets[i].hostname + ' at ' + targets[i].takePercent);

    if (reserveThreads >= maxThreads) {
      logger(ns, 'INFO: max threads hit, stopping take increase calc.')
    } else if (i >= targets.length) {
      logger(ns, 'INFO: hit last avaliable target, stopping take increase calc.')
    } else {
      logger(ns, 'INFO: Calculating take for next target.');
      indexOfTarget++;
      await Server.adjustTake(targets, maxThreads, numBatchesPerCycle, reserveThreads, indexOfTarget);
    }


  }// end of static adjustTake
} //End of server class

/** Main Program
  * Recursivly scans the network, evals targets and drones, deploys (W)GWHW batchs on drone agianst targets
  * @param {NS} ns
  */
export async function main(ns) {

  //Initial Launch
  logger(ns, 'Launching Command and Control.')
  ns.disableLog('ALL');
  let files = ['lt-weaken.js', 'lt-grow.js', 'lt-hack.js'];
  let neededRam = getNeededRam(ns, files);


  //Recursivly Scan the network
  logger(ns, 'INFO: Scanning Network for Servers.');
  let serverList = multiscan(ns, 'home');
  logger(ns, ns.vsprintf('INFO: Found %d Servers on network.', serverList.length));

  //Build working inventory of servers
  logger(ns, 'INFO: Building inventory of Servers');
  let inventory =[];
  let targets =[];
  let drones = [];
  let maxRam = 0;
  for (let i = 0; i < serverList.length; i++) {
    logger(ns, 'INFO: Building ' + serverList[i], 0);
    inventory.push(new Server(ns, serverList[i]));
    logger(ns, 'INFO: Built ' + inventory[i].hostname, 0);
    if (inventory[i].isTarget) {targets.push(inventory[i])}
    if (inventory[i].isDrone) {drones.push(inventory[i])}
    maxRam += inventory[i].maxRam;
  }
  logger(ns, 'INFO: Have ' + targets.length + ' Targets and ' + drones.length + ' Drones.');
  let maxThreads = Math.floor(maxRam/neededRam);
  logger(ns, 'INFO: Max avaliable Ram is ' + maxRam + 'GB yeilding a max of ' + maxThreads + ' Threads.');

  targets.sort(function(a,b) {
    return (b.ratio != null) - (a.ratio != null) || b.ratio - a.ratio;
  });
  await Server.adjustTake(targets, maxThreads);
  // TODO: deploy drone scripts on drones agiast targets

} //end of Main Program

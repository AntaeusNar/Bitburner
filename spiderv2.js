//checks to see if file exsits
export function can(ns, file) {
	return ns.fileExists(file, "home");
}

//get the max needed ram size
export function getNeededRam(ns, files) {
	let needRam = 0;
	for (let file of files) {
		if (ns.getScriptRam(file) > needRam) {
			needRam = ns.getScriptRam(file);
		}
	}
	return needRam;
}

//when given a server, will recursivly scan until it sees all servers
export function multiscan(ns, server) {
	let serverList = [];
	function scanning(server) {
		let currentScan = ns.scan(server);
		currentScan.forEach(server => {
			if (!serverList.includes(server)) {
				serverList.push(server);
				scanning(server);
			}
		})
	}
	scanning(server);
	return serverList;
}

//when given a target will attempt to get root
export function getRoot(ns, target) {
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

/** Ratio Scoring V2
 * $/GB/Sec
 * @param {ns} ns
 * @param {Object} server
 * @param {string} server.name
 * @param {number} server.maxMoney
 * @param {number} neededRam - GB of ram per thread
 * @param {number} takePercent - % of hacked money
 * @returns {Object} returns
 * @returns {number} returns.ration - $/GB/Sec
 * @returns {number} returns.cycleThreads - threads for a full cycle
 */
function getServerRatio_v2(ns, server, neededRam, takePercent) {

	let ratio = null;
	let cycleThreads = null;

	if (server.requiredHack > ns.getHackingLevel() || server.name == 'home' || server.maxMoney == 0) {
		//fails out straight to returns
	} else {
		//calculate time needed per 'batch' in sec
		let totalTime = (ns.getWeakenTime(server.name) + 500)/1000;

		//calculate a target amount of x%
		let targetHackMoney = server.maxMoney*takePercent;

		//calculate GB needed to hack/weak/grow targetHackMoney
		let moneyPerSingleHack = ns.hackAnalyze(server.name)/ns.hackAnalyzeChance(server.name)*server.maxMoney;
		if(isNaN(moneyPerSingleHack)) {
			moneyPerSingleHack = 0;
		}
		let numHackThreads = Math.ceil(targetHackMoney/moneyPerSingleHack);
		if(isNaN(numHackThreads)) {
			numHackThreads = 0;
		}
		let growMultipler = 1/(1-takePercent);
		let numGrowThreads = Math.ceil(ns.growthAnalyze(server.name, growMultipler));
		let numWeakenThreads = Math.ceil(numGrowThreads*.004/.05);
		numWeakenThreads += Math.ceil(numHackThreads*.002/.05);
		if(isNaN(numHackThreads)) {
			let message = 'ERROR: numHackTheads is NaN for ' + server.name + ' maxMoney: ' + server.maxMoney + ' moneyPerSingleThead: ' + moneyPerSingleHack + ' HackanlyzeCHance: ' + ns.hackAnalyzeChance(server.name);
			ns.print(message);
			throw new Error(message);
		} else if(isNaN(numGrowThreads)) {
			let message = 'ERROR: numGrowThreads is NaN for ' + server.name;
			ns.print(message);
			throw new Error(message);
		} else if(isNaN(numWeakenThreads)) {
			let message = 'ERROR: numWeakenThreads is NaN for ' + server.name;
			ns.print(message);
			throw new Error(message);
		}
		let totalThreads = numHackThreads+numGrowThreads+numWeakenThreads;
		let neededGB = totalThreads*neededRam;
		cycleThreads = Math.ceil((totalTime*1000)/100*totalThreads);

		ratio = Math.floor(targetHackMoney/neededGB/totalTime*100)/100;

		if (isNaN(ratio)){
			ratio = null;
			ns.print("Ratio for "+ server.name+ " is NaN" + targetHackMoney + " " + neededGB + " " + totalTime);
		}
	}

	if (ratio == 0 ) {ratio = null;};

	let returns = {
		ratio: ratio,
		cycleThreads: cycleThreads,
	}

	return returns;
}

/** Adjusteds the take perectange to optimal coditions
 * Because increasing the take is a non-linar increase in number of used threads
 * this function will increase each target's take up until the givens targets adjustedRatio
 * is equal to or greater then then next priority target.
 * This should, in theory generate an optimal percent take for each target given a limit on the number of aviable threads
 * That in turn should mean that all targets that can be hacked are being hacked at an optimal $/GB/sec ratio.
 * @param {Object} inventory
 * @param {number} totalReservedThreads
 * @param {boolean} allMaxed
 * @param {number} indexOfAlpha
 */
async function adjustTake(ns, inventory, totalReservedThreads, allMaxed, indexOfAlpha) {

	//while totalReservedThreads is less then maxThreads
	//while target one's adjustedRatio is greater then target two's adjustedRatio
	//increase target one's takePercent until target one's adjustedRatio is less to equal to target two's adjustedRatio
	//OR until take is at 99%
	//Then check target two agianst target three an so on until all have been increased
	//if target x is the last target then just increase the takePercent by 1%
	//if at any time totalReservedThreads is equal to or greater then maxThreads, STOP

	/** Setup */
	//set primary target
	let targetAlpha = inventory.targets[indexOfAlpha];
	//set compairson target
	let targetBeta = inventory.targets[indexOfAlpha + 1];




	//checks to make sure there is a targetBeta and it has a non-null ratio
	if (targetBeta && targetBeta.ratio) {

		//update total reserved threads
		if (totalReservedThreads == 0) {
			totalReservedThreads = targetAlpha.cycleThreads + targetBeta.cycleThreads;
		} else {
			totalReservedThreads += targetBeta.cycleThreads;
		}

		ns.print('Primary target/take/ratio: ' + targetAlpha.name + '/' + targetAlpha.takePercent + '/' + targetAlpha.ratio + '. '
			+ 'Secondary target/take/ratio: ' + targetBeta.name + '/' + targetBeta.takePercent + '/' + targetBeta.ratio + '. '
			+ totalReservedThreads + ' threads reserved of ' + inventory.maxThreads);

		/** adjusting Take */
		while(targetAlpha.adjustedRatio && targetAlpha.adjustedRatio > targetBeta.adjustedRatio && totalReservedThreads < inventory.maxThreads) {

			//increase take by 1%
			let adjustedTake = Math.ceil((targetAlpha.takePercent + .01)*100)/100;
			//if new adjusted take is less then 99%, change everything
			if (adjustedTake <= .99) {
				let returns = getServerRatio_v2(ns, targetAlpha, inventory.neededRam, adjustedTake);
				targetAlpha.takePercent = adjustedTake;
				targetAlpha.adjustedRatio = returns.ratio;
				totalReservedThreads = totalReservedThreads + (returns.cycleThreads - targetAlpha.cycleThreads);
				targetAlpha.cycleThreads = returns.cycleThreads;
				inventory.targets[indexOfAlpha] = targetAlpha;
				await ns.sleep(1);
			} else {
				break;
			}

		}


		ns.print(targetAlpha.name + " Adjusted to " + targetAlpha.takePercent + " Ratio " + targetAlpha.adjustedRatio + '. '
			+ totalReservedThreads + ' threads reserved of ' + inventory.maxThreads);


		if (totalReservedThreads < inventory.maxThreads) {
			indexOfAlpha++;
			await adjustTake(ns, inventory, totalReservedThreads, allMaxed, indexOfAlpha);
			await ns.sleep(1);
		} else {
			ns.print('INFO: Reached Max Available Thread Count. Terminating.');
		}

	} else {


		ns.print('Primary target/take/ratio: ' + targetAlpha.name + '/' + targetAlpha.takePercent + '/' + targetAlpha.ratio + '. '
			+ totalReservedThreads + ' threads reserved of ' + inventory.maxThreads);

		/** adjusting Take */
		while(targetAlpha.adjustedRatio && totalReservedThreads < inventory.maxThreads) {
			let adjustedTake = Math.ceil((targetAlpha.takePercent + .01)*100)/100;
			//ns.print("Adjusting Take of " + targetAlpha.name + ", current take is " + targetAlpha.takePercent + " adjusted Take is " + adjustedTake);

			if (adjustedTake <= .99) {
				let returns = getServerRatio_v2(ns, targetAlpha, inventory.neededRam, adjustedTake);
				targetAlpha.takePercent = adjustedTake;
				targetAlpha.adjustedRatio = returns.ratio;
				targetAlpha.cycleThreads = returns.cycleThreads;
				totalReservedThreads = totalReservedThreads + (returns.cycleThreads - targetAlpha.cycleThreads);
				inventory.targets[indexOfAlpha] = targetAlpha;
				await ns.sleep(1);
			} else {
				break;
			}
		}

		ns.print(targetAlpha.name + " Adjusted to " + targetAlpha.takePercent + " Ratio " + targetAlpha.adjustedRatio + '. '
			+ totalReservedThreads + ' threads reserved of ' + inventory.maxThreads);
		if (!targetBeta) {
			ns.print('INFO: Reached the end of targets while trying to adjust ratios. Terminating.');
		} else {
			ns.print('INFO: Next target ' + targetBeta.name + ' has a null ratio. Terminating.');
		}
	}



}

//given a list of servers and which subset will update inventory
async function updateServerInventory(ns, serverList, inventory, subset) {

	//initial build
	let i = 0;
	for (let server of serverList){
		//info for all
		let maxMoney = ns.getServerMaxMoney(server);
		let minSecurity = ns.getServerMinSecurityLevel(server);
		let ram = ns.getServerMaxRam(server);
		let isPrimedStr = false;
		let isPrimedMoney = false;
		let ratio = 0;
		let requiredHack = ns.getServerRequiredHackingLevel(server);
		let takePercent = .01;
		let cycleThreads = 0;

		if (subset == 'targets') {
			//checking/setting flags
			if (maxMoney == ns.getServerMoneyAvailable(server)) {
				isPrimedMoney = true;
			}
			if (minSecurity == ns.getServerSecurityLevel(server)){
				isPrimedStr = true;
			}

			//calcualte base ratio (priority)
			let target = {
				name: server,
				maxMoney: maxMoney,
				requiredHack: requiredHack
			};

			let returns = getServerRatio_v2(ns, target, inventory.neededRam, takePercent);
			ratio = returns.ratio;
			cycleThreads = returns.cycleThreads;

			//special handling for home
			if (server == 'home') {
				ram -= Math.max(12, ram*.001); //sets home ram to have 32 gbs of reserve space or 0.1% whichever is larger
				ram = Math.max(ram, 0)//max sure we don't go below 0
			}
			//update maxThreads
			inventory.maxThreads += ram/inventory.neededRam

			//Copy files and kill scripts
			if (server != 'home') {
				//copy files
				await ns.scp(inventory.files, 'home', server);

				//kill running scripts
				ns.killall(server);
			}
			//look for coding contracts
			//let cctMessage = "!!!! Server " + server +" has a Coding Contract!!!!";
			//if (ns.ls(server, '.cct').length > 0) {ns.tprint(cctMessage); ns.print(cctMessage);}
			//look for lits
			let lits = ns.ls(server, '.lit');
			if (lits.length > 0) {await ns.scp(lits, server, 'home');}

		} else if (subset == 'otherservers') {

		} else {
			ns.tprint("Error: Subset " + subset + " not reconnised, Terminating");
			throw new Error();
		}
		//add infomation to inventory
		inventory[subset][i] = {
			name: server,
			root: ns.hasRootAccess(server),
			isPrimedMoney: isPrimedMoney,
			isPrimedStr: isPrimedStr,
			ratio: ratio,
			requiredHack: requiredHack,
			numports: ns.getServerNumPortsRequired(server),
			maxMoney: maxMoney,
			maxRam: ram,
			minSecurity: minSecurity,
			takePercent: takePercent,
			adjustedRatio: ratio,
			cycleThreads: cycleThreads,
		}

		i++;
	}

	//sorts
	if (subset == 'targets'){
		inventory.targets.sort(function(a, b){
			return (b.ratio != null) - (a.ratio != null) || b.ratio - a.ratio;
			});
	} else if (subset == 'otherServers') {
		inventory.otherservers.sort((a, b) => b.requiredHack - a.requiredHack);
	}

	return inventory;
}

/** @param {NS} ns */
export async function main(ns) {

	//quite a few things
	ns.disableLog('ALL');

	//main inventory object
	var inventory = {
		files: ['lt-weaken.js', 'lt-grow.js', 'lt-hack.js'],
		maxThreads: 0,
		isAllPrimed: false,
		neededRam: 0,
		targets: [],
		otherservers: [],
	}

	//maxium needed ram to run a single thread
	inventory.neededRam = getNeededRam(ns, inventory.files);

	//Terminal Output
	ns.tprint("Launching: will scan network and gain root access to all available servers and build invetory.");

	//creates list of all servers starting from home
	ns.print("INFO: Building Server List")
	let serverList = multiscan(ns, 'home');

	//tries to hack the servers in serverList and add to rootedServers
	let rootedServers =[];
	for (let server of serverList) {
		if (ns.hasRootAccess(server) || server == 'home' || getRoot(ns, server)) { //adds home to rooted servers, along with all rooted and rootable
			rootedServers.push(server);
		}
	}

	//update inventory with targets
	inventory = await updateServerInventory(ns, rootedServers, inventory, 'targets');

	//remove availible targets from serverlist
	serverList = serverList.filter(x => !rootedServers.includes(x));

	//update remaining servers
	inventory = await updateServerInventory(ns, serverList, inventory, 'otherservers');
	ns.print('INFO: Root access on ' + rootedServers.length + ' servers, with ' + serverList.length + ' additional servers found on network.')
	ns.tprint('INFO: Root access on ' + rootedServers.length + ' servers, with ' + serverList.length + ' additional servers found on network.')

	inventory.maxThreads = Math.floor(inventory.maxThreads)
	ns.print('INFO: ' + inventory.maxThreads + ' Maxium Threads across all servers avaliable.')

	//take adjustment section
	let totalReservedThreads = 0;
	let allMaxed = false;
	let indexOfAlpha = 0;
	ns.print('INFO: Adjusting take % of all targets.')
	await adjustTake(ns, inventory, totalReservedThreads, allMaxed, indexOfAlpha);


	// output the inventory object as JSON into a txt file
	if (ns.fileExists('inventoryv2.txt')) {
		ns.rm('inventoryv2.txt');
	}
	await ns.write('inventoryv2.txt', JSON.stringify(inventory, null, '\t'), 'w');

	//launch c_c
	ns.tprint("Launching C&C v3 please stand by.")
	ns.spawn("c_cv3.js");
}

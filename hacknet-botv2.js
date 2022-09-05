import {budgetPercentageLimit, paybackTimeLimit, bitNodeMultipliers} from 'options.js';

/** @param {NS} ns **/
export async function main(ns) {

	ns.disableLog('sleep');
	ns.disableLog('getServerMoneyAvailable')
	var paybackLimit = paybackTimeLimit;
	var sleepMilliseconds = 1*1000;
	var budgetPercentage = budgetPercentageLimit;

	while (true) {
		var budget = ns.getServerMoneyAvailable('home')*budgetPercentage;
		var nodeNumber = ns.hacknet.numNodes();
		var actionList = [];
		if (nodeNumber > 0) {
			for (var i = 0; i < nodeNumber; i++) {
				var nodeActions = [];
				nodeActions.push(new RamAction(ns, i));
				nodeActions.push(new CoreAction(ns, i));
				nodeActions.push(new LevelAction(ns, i));
				nodeActions.forEach(action => actionList.push(action));
			}
		}
		actionList.push(new NewNodeAction(ns, 1));
    	let neglist = actionList.filter(action => action.prodIncrease < 0);
		if (neglist.length > 0) {
			throw new Error('Have negative production increases in actions.  Most likley BitNode HackNetNodeMoneyBitNode is wrong.');
		}
		actionList = actionList.filter(action => action.payBackTime() < paybackLimit);
		if (actionList.length > 0) {
			actionList = actionList.filter(action => action.cost < budget);
			if (actionList.length > 0) {// Second check, we don't want to escape the script if there are actions we will be able to afford later
				actionList.sort(function (x, y) { x.payBackTime() - y.payBackTime() });
				actionList[0].doAction();
				sleepMilliseconds = Math.max(actionList[0].payBackTime()*1000, sleepMilliseconds);
			}
			await ns.sleep(sleepMilliseconds);
		} else {
			ns.tprint(`All Hacknet Nodes are fully productive.`);
			break;
		}
	}
}

class Action {
	constants = {
		MaxLevel: 200,
		MaxRam: 64,
		MaxCores: 16,
		MoneyGainPerLevel: 1.5,
		HackNetNodeMoneyBitNode: bitNodeMultipliers.HackNetNodeMoneyBitNode, /** <= Needs to be adjusted for every bitnode -> https://github.com/danielyxie/bitburner/blob/dev/src/BitNode/BitNode.tsx*/
	}
	sys;
	nodeIndex;

	cost;
	originalProd;
	prodIncrease;
	name;
	multProd;
	ram;
	level;
	cores;
	ns;

	doAction = () => { return null; };

	constructor(ns, nodeIndex) {
		this.ns = ns;
		this.sys = ns.hacknet;
		this.nodeIndex = nodeIndex;
		this.multProd = ns.getHacknetMultipliers().production;
		var stats = this.sys.getNodeStats(nodeIndex);
		this.name = stats.name;
		this.ram = stats.ram;
		this.level = parseFloat(stats.level);
		this.cores = parseFloat(stats.cores);
		this.originalProd = parseFloat(stats.production);
	}
	payBackTime() {
		return this.cost / this.prodIncrease;
	}
	upgradedProdRate(ns) {
		var updatedRate = this.calculateMoneyGainRate(this.level, this.ram, this.cores, this.multProd);
		return updatedRate;
	}

	calculateMoneyGainRate(level, ram, cores, mult) {
		const gainPerLevel = this.constants.MoneyGainPerLevel;
		const levelMult = level * gainPerLevel;
		const ramMult = Math.pow(1.035, ram - 1);
		const coresMult = (cores + 5) / 6.0;

		var result = levelMult;
		result *= ramMult;
		result *= coresMult;
		result *= mult;
		result *= this.constants.HackNetNodeMoneyBitNode;
		return result;
	}
}

class RamAction extends Action {
	constructor(ns, nodeIndex) {
		super(ns, nodeIndex);
		this.cost = this.sys.getRamUpgradeCost(this.nodeIndex, 1);
		if (isFinite(this.cost) && this.cost > 0) {
			++this.ram;
			this.prodIncrease = this.upgradedProdRate(ns);
			this.prodIncrease -= this.originalProd;
			this.doAction = () => {
				this.sys.upgradeRam(nodeIndex, 1);
				let ms = this.payBackTime()*1000;
				ns.print("Paybacktime = " + ms + " Cost = " + this.cost + " prodIncrease = " + this.prodIncrease);
				ns.print(`upgrading Ram on node ${this.nodeIndex}, payback time is ${new Date(ms).toISOString().slice(11,23)}`);
			}
		}
		else {
			this.prodIncrease = 0;
		}
	}
}

class LevelAction extends Action {
	constructor(ns, nodeIndex) {
		super(ns, nodeIndex);
		this.cost = this.sys.getLevelUpgradeCost(this.nodeIndex, 1);
		if (isFinite(this.cost) && this.cost > 0) {
			++this.level;
			this.prodIncrease = this.upgradedProdRate(ns);
			this.prodIncrease -= this.originalProd;
			this.doAction = () => {
				this.sys.upgradeLevel(nodeIndex, 1);
				let ms = this.payBackTime()*1000;
				ns.print("Paybacktime = " + ms + " Cost = " + this.cost + " prodIncrease = " + this.prodIncrease);
				ns.print(`upgrading Level on node ${this.nodeIndex}, payback time is ${new Date(ms).toISOString().slice(11,23)}`);
			}
		}
		else {
			this.prodIncrease = 0;
		}
	}
}
class CoreAction extends Action {
	constructor(ns, nodeIndex) {
		super(ns, nodeIndex);
		this.cost = this.sys.getCoreUpgradeCost(this.nodeIndex, 1);
		if (isFinite(this.cost) && this.cost > 0) {
			++this.cores;
			this.prodIncrease = this.upgradedProdRate(ns);
			this.prodIncrease -= this.originalProd;
			this.doAction = () => {
				this.sys.upgradeCore(nodeIndex, 1);
				let ms = this.payBackTime()*1000;
				ns.print("Paybacktime = " + ms + " Cost = " + this.cost + " prodIncrease = " + this.prodIncrease);
				ns.print(`upgrading Core on node ${this.nodeIndex}, payback time is ${new Date(ms).toISOString().slice(11,23)}`);
			}
		}
		else {
			this.prodIncrease = 0;
		}
	}
}
class NewNodeAction extends Action {
	constructor(ns, nodeIndex) {
		super(ns, 0);
		this.ram = 1;
		this.level = 1;
		this.cores = 1;
		this.originalProd = 0;
		this.cost = this.sys.getPurchaseNodeCost();
		if (isFinite(this.cost) && this.cost > 0) {
			this.prodIncrease = this.upgradedProdRate(ns);
			this.prodIncrease -= this.originalProd;
			this.doAction = () => {
				this.sys.purchaseNode();
				let ms = this.payBackTime()*1000;
				ns.print("Paybacktime = " + ms + " Cost = " + this.cost + " prodIncrease = " + this.prodIncrease);
				ns.print(`Purchasing a new node. payback time is ${new Date(ms).toISOString().slice(11,23)}`);
			}
		}
		else {
			this.prodIncrease = 0;
		}
	}
}

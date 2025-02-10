import { logger } from "./lib/lib.general";

/** attempts to ascend member
	* @param {NS} ns
	* @param {string} memberName
	*/
function tryToAscend(ns, memberName) {
  let result = false;
	let ascended = ns.gang.getAscensionResult(memberName);
  if (ascended) {
    if (ascended.str > 2 ||
        ascended.agi > 2 ||
        ascended.def > 2 ||
        ascended.dex > 2) {
          result = true;
      }
  }
  if (result) {
		ns.gang.ascendMember(memberName);
		logger(ns, 'INFO: Ascended ' + memberName, 0);
	}
}

/** @param {NS} ns */
export async function main(ns) {

	/** Basic auto-management of a gang */
	ns.disableLog('sleep');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('gang.setMemberTask');
  ns.disableLog('gang.purchaseEquipment');
  let allEquipment = ns.gang.getEquipmentNames();
  let vigJust = false;
  let warfare = false;

  /** Main Control Loop */
	while (true) {

		//get basic gang info
		let gangCrew = ns.gang.getMemberNames();
		let gangInfo = ns.gang.getGangInformation();
    let otherGangs = ns.gang.getOtherGangInformation();
    delete otherGangs[gangInfo.faction];
    let activeWarfare = gangInfo.territoryWarfareEngaged;

    //Try to recruit a new member
    if (ns.gang.canRecruitMember()) {
      let number = Math.floor(Math.random()*1000);
      let name = "Fish" + number;
      ns.gang.recruitMember(name);
      gangCrew = ns.gang.getMemberNames();
    }

    //Wanted Level
    if (!vigJust && gangInfo.wantedPenalty < .5 && gangInfo.wantedLevel > 2) {
      vigJust = true;
      logger(ns, 'INFO: Reducing Wanted Level!', 0);
    } else if (vigJust && (gangInfo.wantedPenalty > .9 || gangInfo.wantedLevel < 2)) {
      vigJust = false;
      logger(ns, 'INFO: Commit those Crimes!', 0);
    }

    /** Control Options
     * If we do not need to reduce the wanted level by committing Vigilante Justice, we need to generate a list of selectable options.
     * Terrorism increases respect, and should only be added to available tasks if we need to recruit new gang members. (less then 12)
     * Territory Warfare should only be an option if we do not have 100% of the territory.
     * Crime is a category, not a single task.  Each gang member will pick their own best crime.
     */
    let arrTasks = [];
    if (vigJust) { arrTasks.push('Vigilante Justice'); }
    else if (gangCrew.length < 12) { arrTasks.push('Terrorism'); }
    else if (gangInfo.territory < 1 ) { arrTasks.push('Territory Warfare'); }
    else { arrTasks.push('Crime'); }

    for (let member of gangCrew) {
      //try to ascend
      tryToAscend(ns, member);
      //get member info
      let memberInfo = ns.gang.getMemberInformation(member);
      /** Purchase Equipment */
      //Collect equipment info
      //Hack for keeping enough money in the pot to be buying the basics after a reset.
      let budget = ns.getServerMoneyAvailable('home')-250000000;
      let memberEquipment = memberInfo.upgrades; //get a member's equipment
      memberEquipment += memberInfo.augmentations; //add the member's augments
      let neededEquipment = allEquipment.filter(item => !memberEquipment.includes(item)); //remove everything the member has from the master list
      //remove all items that are hacking and chr only.
      neededEquipment = neededEquipment.filter(item => ns.gang.getEquipmentStats(item).agi ||
                                                          ns.gang.getEquipmentStats(item).def ||
                                                          ns.gang.getEquipmentStats(item).dex ||
                                                          ns.gang.getEquipmentStats(item).str)

      let purchasedEquiment = false;
      let numberofpurchases = 0;
      for (let item of neededEquipment) {
        let cost = ns.gang.getEquipmentCost(item);
        if (budget > cost) {
          ns.gang.purchaseEquipment(member, item);
          purchasedEquiment = true;
          numberofpurchases++;
          budget -= cost;
        }
        await ns.sleep(1);
      }
      if (purchasedEquiment) {
        logger(ns, "Purchased " + numberofpurchases + " item(s) for " + member, 0);
      }

      // Assign work
      let task = arrTasks[Math.floor(Math.random()*arrTasks.length)];
      if (memberInfo.str < 50) { task = 'Train Combat'; }
      if (task == 'Crime') {
        if (memberInfo.str < 150) { task = 'Strongarm Civilians'; }
        else if (memberInfo.str < 400) { task = 'Traffick Illegal Arms'; }
        else { task = 'Human Trafficking'; }
      }
      ns.gang.setMemberTask(member, task);
    }//end of gangcrew loop

    // Gang Warfare
    let maxPower = 0;
    Object.keys(otherGangs).forEach(key => {
      maxPower = Math.max(maxPower, otherGangs[key].power);
    });
    if (gangInfo.power > maxPower && gangInfo.territory < 1) {
      warfare = true;
    }
    //Warfare Update
    if (!activeWarfare && warfare) {
      ns.gang.setTerritoryWarfare(true);
    } else if (activeWarfare && !warfare) {
      ns.gang.setTerritoryWarfare(false);
    }

    await ns.sleep(10*1000);
	}
}

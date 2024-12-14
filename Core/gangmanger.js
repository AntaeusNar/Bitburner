import {logger} from 'lib.js';
import {budgetPercentageLimit} from 'options.js'

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

	/** Basic automanagement of a gang */
	ns.disableLog('sleep');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('gang.setMemberTask');
  ns.disableLog('gang.purchaseEquipment');
  let allEquipment = ns.gang.getEquipmentNames();
  let budgetPercentage = budgetPercentageLimit;
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

    //Try to recrute a new member
    if (ns.gang.canRecruitMember()) {
      let number = Math.floor(Math.random()*1000);
      let name = "Fish" + number;
      ns.gang.recruitMember(name);
      gangCrew = ns.gang.getMemberNames();
    }

    /** Control Options */
    //Tasks are Terrorism, Territory Warfare, Vigilante Justice or crime.
    //Vigilante Justice will be an override (if needed all do)

    let arrTasks = []; //blank available tasks
    arrTasks.push('Crime'); //add crime option
    arrTasks.push('Terrorism'); //add Terrorism as addition option
    if (gangCrew.length < 12) {arrTasks.push('Terrorism'); arrTasks.push('Crime');} // add Terrorism if less then 12 gang members
    if (gangInfo.territory < 1) {arrTasks.push('Territory Warfare');}//add Warfare if we dont have 100% terriory


    //Wanted Level
    if (!vigJust && gangInfo.wantedPenalty < .5 && gangInfo.wantedLevel > 2) {
      vigJust = true;
      logger(ns, 'INFO: Reducing Wanted Level!', 0);
    } else if (vigJust && (gangInfo.wantedPenalty > .9 || gangInfo.wantedLevel < 2)) {
      vigJust = false;
      logger(ns, 'INFO: Commit those Crimes!', 0);
    }

    for (let member of gangCrew) {
      //try to ascend
      tryToAscend(ns, member);
      //get member info
      let memberInfo = ns.gang.getMemberInformation(member);
      /** Puchase Equipment */
      //Collect equipment info
      let budget = ns.getServerMoneyAvailable('home')*budgetPercentage;
      let memberEquipment = memberInfo.upgrades; //get a member's equipment
      memberEquipment += memberInfo.augmentations; //add the member's augments
      let neededEquipment = allEquipment.filter(item => !memberEquipment.includes(item)); //remove everythign the member has from the master list
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
      if (vigJust) {
        ns.gang.setMemberTask(member, 'Vigilante Justice');
      } else {
        if (memberInfo.str < 50) {
          ns.gang.setMemberTask(member, 'Train Combat');
        } else {
          let task = arrTasks[Math.floor(Math.random()*arrTasks.length)];
          if (task == 'Crime') {
            if (memberInfo.str < 50) {
              ns.gang.setMemberTask(member, "Mug People");
            }
            else if (memberInfo.str < 150) {
              ns.gang.setMemberTask(member, "Strongarm Civilians");
            }
            else if (memberInfo.str < 400) {
              ns.gang.setMemberTask(member, "Traffick Illegal Arms");
            }
            else {
              ns.gang.setMemberTask(member, "Human Trafficking");
            }
          } else {
            ns.gang.setMemberTask(member, task);
          }
        }
      }

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

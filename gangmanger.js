import {logger} from 'lib.js';

/** attempts to ascend member
	* @param {NS} ns
	* @param {string} memberName
	*/
function tryToAscend(ns, memberName) {
  let result = false;
	let ascended = ns.gang.getAscensionResult(memberName);
  if (ascended.str > 2 ||
      ascended.agi > 2 ||
      ascended.cha > 2 ||
      ascended.def > 2 ||
      ascended.dex > 2 ||
      ascended.hack > 2) {
        result = true;
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
  let budgetPercentage = 0.9;
  let vigJust = false;
  let requestWarfare = false;
  let requestTerrorism = false;
  let requestPrep = false;
  let requestExit = false;

  /** Main Control Loop */
	while (true) {

		//get basic gang info
		let gangCrew = ns.gang.getMemberNames();
		let gangInfo = ns.gang.getGangInformation();
    let otherGangs = ns.gang.getOtherGangInformation();
    delete otherGangs[gangInfo.faction];
    let activeWarfare = gangInfo.territoryWarfareEngaged;

    /** Control Options */
    // Gang size
    if (gangCrew.length == 12) {
      //Active Terrorism
      if (requestTerrorism) { //there are 12, don't need this anymore
        requestTerrorism = false;
        logger(ns, 'INFO: Stopping Terrorism.', 0);
      }
      //Gang Warefare
      let maxPower = 0;
      Object.keys(otherGangs).forEach(key => {
        maxPower = Math.max(maxPower, otherGangs[key].power);
      });
      if (gangInfo.power >= maxPower && gangInfo.territory < 1 && !requestWarfare){ //12, strong, and need territory
        requestWarfare = true;
        requestPrep = true;
        logger(ns, 'INFO: Full gang, strong gang, requesting to go to war.', 0);
      } else if (gangInfo.territory >= 1 && requestWarfare) { //already own everything
        requestWarfare = false;
        requestPrep = false;
        requestExit = true;
        logger(ns, 'INFO: We have everyone, we own everything, stopping warfare and exiting.', 0);
      } else {//12, not strong enough, need territory
        requestWarfare = false;
        requestPrep = true;
        logger(ns, 'INFO: Full Crew, getting ready to fight!', 0);
      }
    } else { //less then 12
      if (requestWarfare) {//less then 12 and active warfare
        requestWarfare = false;
        requestPrep = false;
        logger(ns, 'WARNING: Man down. Stopping Warfare.', 0);
      }
      //Try to recrute a new member
      if (ns.gang.canRecruitMember()) {
        let number = Math.floor(Math.random()*1000);
        let name = "Fish" + number;
        ns.gang.recruitMember(name);
        gangCrew = ns.gang.getMemberNames();
      } else if (!requestTerrorism) {
        //or do that Terrorism
        requestTerrorism = true;
        logger(ns, 'INFO: Terrorise!!', 0);
      }
    }

    //Wanted Level
    if (gangInfo.wantedLevel < .5 && gangInfo.wantedLevel > 2) {
      vigJust = true;
      logger(ns, 'INFO: Reducing Wanted Level!', 0);
    } else if (vigJust && (gangInfo.wantedPenalty > .9 || gangInfo.wantedLevel < 2)) {
      vigJust = false;
      logger(ns, 'INFO: Commit those Crimes!', 0);
    }

    let budget = ns.getServerMoneyAvailable('home')*budgetPercentage;

    /** Gang Member Control sub loop */
    for (let member of gangCrew) {

      //possible ascention
      tryToAscend(ns, member);

      //Basic memberInfo
      let memberInfo = ns.gang.getMemberInformation(member);

      /** Puchase Equipment */
      //Collect equipment info
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

      // Asign Work
      if (vigJust) { //Check and deal with wanted penaltiy
        ns.gang.setMemberTask(member, 'Vigilante Justice');
      } else { //regulare optiations
        if (memberInfo.str < 50) { //make sure the dude is strong enough
          ns.gang.setMemberTask(member, 'Train Combat');
        } else {//member is go to go
          if ((requestPrep || requestWarfare) && memberInfo.str > 150) {
            ns.gang.setMemberTask(member, 'Territory Warfare');
          } else {
            if (requestTerrorism && memberInfo.str > 150){
              ns.gang.setMemberTask(member, 'Terrorism');
            } else {
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
            }
          }
        }
      }
      await ns.sleep(1);
    }//end of member loop

    //Warfare Update
    if (!activeWarfare && requestWarfare) {
      ns.gang.setTerritoryWarfare(true);
    } else if (activeWarfare && !requestWarfare) {
      ns.gang.setTerritoryWarfare(false);
    }

    //exit update
    if (requestExit){
      logger(ns, 'INFO: Exit Requested, Exiting.....', 0);
      ns.exit();
    }
    await ns.sleep(10*1000);
	}
}

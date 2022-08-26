import {logger} from 'lib.js';

/** attempts to ascend member
	* @param {NS} ns
	* @param {string} getMember
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
  var budgetPercentage = 0.9;
  let vigJust = false;

	while (true) {

		//get basic gang info
		let gangCrew = ns.gang.getMemberNames();
		let gangInfo = ns.gang.getGangInformation();
    let otherGangs = ns.gang.getOtherGangInformation();
    delete otherGangs[gangInfo.faction];
    let maxPower = 0;
    Object.keys(otherGangs).forEach(key => {
      maxPower = Math.max(maxPower, otherGangs[key].power);
    });
    ns.print(maxPower);

    let budget = ns.getServerMoneyAvailable('home')*budgetPercentage;

    //Try to recrute a new member
    if (ns.gang.canRecruitMember()) {
      let number = gangCrew.length + 1;
      let name = "Fish" + number;
      ns.gang.recruitMember(name);
    }

    //check wanted level
    ns.print("Wanted Level penalty is " + gangInfo.wantedPenalty + " Wanted Level is " + gangInfo.wantedLevel);
    if (gangInfo.wantedPenalty < .5 && gangInfo.wantedLevel > 2) {
      vigJust = true;
      ns.print("Reducing wanted level");
    } else if (vigJust && (gangInfo.wantedPenalty > .9 || gangInfo.wantedLevel < 2)) {
      vigJust = false;
      ns.print("Commit those Crimes");
    }

    //Cycle through each member, and set tasks
    for (let member of gangCrew) {
      let memberInfo = ns.gang.getMemberInformation(member);

      //possible ascention
      tryToAscend(ns, member);

      //purchase equipment
      let memberEquipment = memberInfo.upgrades;
      memberEquipment += memberInfo.augmentations;
      let neededEquipment = allEquipment.filter(item => !memberEquipment.includes(item));

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
        ns.print("Purchased " + numberofpurchases + " item(s) for " + member);
      }

      // Asign Work
      if (vigJust) { //Check and deal with wanted penaltiy
        ns.gang.setMemberTask(member, 'Vigilante Justice');
      } else { //regulare optiations
        if (memberInfo.str < 50) { //make sure the dude is strong enough
          ns.gang.setMemberTask(member, 'Train Combat');
        } else {//member is go to go

          let roll = 1+ Math.floor(Math.random() * 3);

          switch(roll) {
            case 1:
              if (memberInfo.str > 150 && gangCrew.length < 12) {
                ns.gang.setMemberTask(member, "Terrorism");
                break;
              }
            case 2:
              if ((gangInfo.territory < 1 || gangInfo.power <= maxPower) && memberInfo.str > 150) {
                ns.gang.setMemberTask(member, "Territory Warfare");
                break;
              }
            case 3:
            default:
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
      await ns.sleep(1);
    }

    if (gangInfo.power > maxPower && gangInfo.territory < 1) {
      ns.gang.setTerritoryWarfare(true);
    } else {
      ns.gang.setTerritoryWarfare(false);
    }
    await ns.sleep(10*1000);
	}
}

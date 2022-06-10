/** @param {NS} ns */
export async function main(ns) {

	/** Basic automanagement of a gang */
	ns.disableLog('sleep');

	while (true) {

		//get basic gang info
		let gangCrew = ns.gang.getMemberNames();
		let gangInfo = ns.gang.getGangInformation();

    //Cycle through each member, and set tasks
    for (let member of gangCrew) {
      let memberInfo = ns.gang.getMemberInformation(member);


      //check for wantedPenalty
      if (gangInfo.wantedPenalty < .75) {
        ns.gang.setMemberTask(member, 'Vigilante Justice');
      } else if (gangInfo.wantedPenalty > .95 || gangInfo.wantedLevel < 2) {
        let roll = 1+ Math.floor(Math.random() * 3);
        switch(roll) {
          case 1:
		        ns.gang.setMemberTask(member, "Terrorism");
            break;
          case 2:
            ns.gang.setMemberTask(member, "Territory Warfare");
            break;
          case 3:
          default:
            if (memberInfo.str < 150) {
              ns.gang.setMemberTask(member, "Mug People")
            }
            else if (memberInfo.str < 500) {
              ns.gang.setMemberTask(member, "Strongarm Civilians")
            }
            else {
              ns.gang.setMemberTask(member, "Traffick Illegal Arms")
            }
        }
      }
      await ns.sleep(1);
    }
    await ns.sleep(10*1000);
	}
}

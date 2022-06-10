/** @param {NS} ns */
export async function main(ns) {

	/** Basic automanagement of a gang */
	ns.disableLog('sleep');

	while (true) {
		await ns.sleep(1);
		//get basic gang info
		let gangCrew = ns.gang.getMemberNames();
		let gangInfo = ns.gang.getGangInformation();

		//cycle between strong arming civilians and vigilate justice
		if (gangInfo.wantedPenalty < .75 ) {
			ns.print("Wanted Penalty is high, reducing.");
			for (let member of gangCrew) {

				ns.gang.setMemberTask(member, 'Vigilante Justice');
			}
		} else if (gangInfo.wantedPenalty > .95 || gangInfo.wantedLevel < 2) {
			ns.print("Back to crime!!!");
			for (let member of gangCrew) {

				ns.gang.setMemberTask(member, 'Traffick Illegal Arms');
			}
		}
	}

}

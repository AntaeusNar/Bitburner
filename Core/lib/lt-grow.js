/** @param {NS} ns */
export async function main(ns) {
let target = ns.args[0];
	let sleeptime = ns.args[1] * 1000;
	await ns.sleep(sleeptime);
	await ns.grow(target);
}

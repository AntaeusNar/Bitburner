/* This script based on: https://github.com/Chrisch3n/BitburnerScripts/blob/main/map.js by u/Chrisch3n
20241020
Script based on: https://www.reddit.com/r/Bitburner/comments/rmpgn5/map_code/ by u/Ravery-net
2022-02-03
- Added Help menu
- Added colored Symbols, Backdoor indicator, Required Ports for Hack and Maximum Server Money
- Switches for added information (Change constants at the beginning of code to (de)-activate them individually)
- Information if Server is hackable now checks also required Server ports against player capability
*/

import { backdoorTo, recServerScan, tryGetRoot } from "./lib.misc";
import { serverOfInterest } from "./options";

// Switches (Change constants to change design of Tree)
const controlSymbolTypeColor = true; // True = Colored Root Access Symbols / False = ASCII Art
const controlPortsRequiredIndicator = true; // True = Required Ports will be shown after Server Hacking Level Requirement / False = Hidden
const controlBackdoorIndicator = true; // True = Backdoor Indicator active / False = Hidden
const controlMaxMoneyIndicator = true; // True = Show Max Money of Server / False = Hidden

var _ns;
export async function main(ns) {
	var seenList = [];
	_ns = ns;
	let input = ns.args[0];

	// Help Menu
	if (input === "-h" || input === "-help" || input === "help" || input === "-?" || input === "?") {
		ns.tprint("");
		ns.tprint("****************************************************  Help Menu  ****************************************************");
		ns.tprint('Mapping: "Root access", [Backdoor], "Server name", ("Server Level", [Required Ports]), [Max. Money Server], [Hacking possible]');
		if (controlSymbolTypeColor) {
			ns.tprint("- \u2705 = Root access / \u274C = No root access ");
		} else {
			ns.tprint("- ██ = Root access / [ ] = No root access ");
		}
		ns.tprint("- [Optional] Backdoor: [BD] = Backdoor installed / [NO BD] = No Backdoor");
		ns.tprint("- [Optional] Port Info: Variable behind Servername (Required Hacking Level - Required Server Ports)");
		ns.tprint('- "!!!!!!" at the end indicates, that your hacking and port hacking level is above the');
		ns.tprint("  requirements of the server but you don't have root access yet.");
		ns.tprint("  You can add an alias for this command as `alias map='path/map.js'`.");
		ns.tprint("");
		ns.tprint("Note: Colored Symbols, Required Server Ports, Backdoor Indicator and Max. Money can be ");
		ns.tprint("      (de)activated by changing the constants at the beginning of the script")
		ns.tprint("*********************************************************************************************************************");
	} else {
		let serverList = recServerScan(_ns);
		for (let server of serverList) {
			server = _ns.getServer(server);
			tryGetRoot(_ns, server);
		}
		ScanServer("home", seenList, 0, "");

		serverOfInterest.forEach(server => {
			try {
				server = _ns.getServer(server);
				if (serverList.includes(server.hostname) && !server.backdoorInstalled && server.hasAdminRights && server.requiredHackingSkill <= _ns.getHackingLevel()) {
					_ns.tprint('COPY TO TERMINAL: ' + backdoorTo(_ns, server.hostname));
				}
			} catch {
				// Nothing happens, move on?
			}

		});
		ns.tprint("Note: Add -h to function call to open help");
	}
}

function ScanServer(serverName, seenList, indent, prefix) {
	if (seenList.includes(serverName)) return;
	seenList.push(serverName);

	var serverList = _ns.scan(serverName);
	serverList = serverList.filter(function (item) { return seenList.indexOf(item) === -1; });
	serverList = serverList.sort(ChildCountCompare);

	for (var i = 0; i < serverList.length; i++) {
		var newServer = serverList[i];
		if (seenList.includes(newServer)) continue;
		if (i != serverList.length - 1) {
			PrintServerInfo(newServer, indent, prefix + "├─")
			ScanServer(newServer, seenList, indent + 1, prefix + "│    ");
		}
		else {
			PrintServerInfo(newServer, indent, prefix + "└─")
			ScanServer(newServer, seenList, indent + 1, prefix + "     ");
		}
	}
}

function ChildCountCompare(a, b) {
	var ax = ChildCount(a);
	var bx = ChildCount(b);
	return ChildCount(a) > ChildCount(b) ? 1 : -1;
}

function ChildCount(serverName) {
	var count = 0;
	var serverList = _ns.scan(serverName);
	for (var i = 1; i < serverList.length; i++) {
		count += ChildCount(serverList[i]) + 1;
	}
	return count;
}

function PrintServerInfo(serverName, indent, prefix) {
	var indentString = prefix;
	var serverinfo = _ns.getServer(serverName); //Interface of requested server
	// Definition of Root Access Symbols
	if (controlSymbolTypeColor) {
		var hacked = (serverinfo.hasAdminRights) ? "\u2705" : "\u274C";
	} else {
		var hacked = (serverinfo.hasAdminRights) ? " \u2611 " : " \u2612 ";
	}
	var serverHackingLevel = serverinfo.requiredHackingSkill;
	var serverPortLevel = serverinfo.numOpenPortsRequired;
	var canHackIndicator = "";
	var backdoorIndicator = "";
	var portReqIndicator = "";
	var maxMoneyIndicator = "";

	if (_ns.getHackingLevel() >= serverHackingLevel) {
		canHackIndicator = "  >> !!!!!!!!!  CAN HACK  !!!!!!!!!"
	}
	// Definition of Backdoor Symbols
	if (controlBackdoorIndicator && controlSymbolTypeColor) {
		backdoorIndicator = (serverinfo.backdoorInstalled) ? " [BD] " : " [X] ";
	} else if (controlBackdoorIndicator && !controlSymbolTypeColor) {
		backdoorIndicator = (serverinfo.backdoorInstalled) ? " [BD] " : " [NO BD] ";
	}
	// Definition of required Port Level indicator
	if (controlPortsRequiredIndicator) {
		portReqIndicator = " P:" + serverPortLevel + "/" + serverinfo.openPortCount;
	}
	// Definition of Maximum Money Indicator
	if (controlMaxMoneyIndicator) {
		maxMoneyIndicator = " [Max Money" + _ns.nFormat(serverinfo.moneyMax, "($ 0.00a)") + "] ";
	}
	_ns.tprint(indentString + hacked + backdoorIndicator + serverName + " (" + serverHackingLevel + portReqIndicator + ")" + maxMoneyIndicator + canHackIndicator);
}

function HackablePortsPlayer() {
	let hackablePortsPlayer = 0;
	if (_ns.fileExists("BruteSSH.exe", "home")) {
		hackablePortsPlayer = hackablePortsPlayer + 1;
	}
	if (_ns.fileExists("FTPCrack.exe", "home")) {
		hackablePortsPlayer = hackablePortsPlayer + 1;
	}
	if (_ns.fileExists("HTTPWorm.exe", "home")) {
		hackablePortsPlayer = hackablePortsPlayer + 1;
	}
	if (_ns.fileExists("relaySMTP.exe", "home")) {
		hackablePortsPlayer = hackablePortsPlayer + 1;
	}
	if (_ns.fileExists("SQLInject.exe", "home")) {
		hackablePortsPlayer = hackablePortsPlayer + 1;
	}
	return hackablePortsPlayer;
}

//var hacked = (_ns.hasRootAccess(serverName)) ? "██ " : "[] ";
/* Script based on: https://www.reddit.com/r/Bitburner/comments/rmpgn5/map_code/ by u/Ravery-net
2022-02-03
- Added Help menu
- Added colored Symbols, Backdoor indicator, Required Ports for Hack and Maximum Server Money
- Switches for added information (Change constants at the beginning of code to (de)-activate them individually)
- Information if Server is hackable now checks also required Server ports against player capability
*/

import {multiScan, backdoorTo} from './lib/lib.general.js';
import {serverOfInterest, colors} from './lib/options.general.js';

// Switches (Change constants to change design of Tree)
const controlSymbolTypeColor = true; // True = Colored Root Access Symbols / False = Asscii Art
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
			ns.tprint("- [Optional] Backdoor: [BD] = Backdoor installed / [x] = No Backdoor");
			ns.tprint("- [Optional] Port Info: Variable behind Servername (Required Hacking Level - Required Server Ports)");
			ns.tprint('- If "!!!!!!" at the end is shown, your hacking and port hacking level is above the');
			ns.tprint('  requirements of the server but you do not have root access yet.');
		} else {
			ns.tprint("- ██ = Root access / [ ] = No root access ");
			ns.tprint("- [Optional] Backdoor: [BD] = Backdoor installed / [NO BD] = No Backdoor");
			ns.tprint("- [Optional] Port Info: Variable behind Servername (Required Hacking Level - Required Server Ports)");
			ns.tprint('- "!!!!!!" at the end indicates, that your hacking and port hacking level is above the');
			ns.tprint('  requirements of the server but you do not have root access yet.');
		}
		ns.tprint("");
		ns.tprint("Note: Colored Symbols, Required Server Ports, Backdoor Indicator and Max. Money can be ");
		ns.tprint("      (de)activated by changing the constants at the beginning of the script")
		ns.tprint("*********************************************************************************************************************");
	} else {
		let serverList = multiScan(_ns);
		let nextHack = 100000000000000;
		for (let server of serverList) {
			server = _ns.getServer(server);
			if(server.requiredHackingSkill > _ns.getHackingLevel() && server.requiredHackingSkill < nextHack){
				nextHack = server.requiredHackingSkill;
			}
		}
		ScanServer("home", seenList, 0, "", nextHack);

		serverOfInterest.forEach(server => {
      try {
			  server = _ns.getServer(server);
      }
      catch (error) {
        //_ns.tprint(error);
      }

			if(serverList.includes(server.hostname) && !server.backdoorInstalled && server.hasAdminRights && server.requiredHackingSkill <= _ns.getHackingLevel()) {
				_ns.tprint('COPY TO TERMINAL: ' + backdoorTo(_ns, server.hostname));
			}});
		ns.tprint("Note: Add -h to function call to open help");
	}
}

function ScanServer(serverName, seenList, indent, prefix, nextHack) {
	if (seenList.includes(serverName)) return;
	seenList.push(serverName);

	var serverList = _ns.scan(serverName);
	serverList = serverList.filter(function (item) { return seenList.indexOf(item) === -1; });
	serverList = serverList.sort(ChildCountCompare);

	for (var i = 0; i < serverList.length; i++) {
		var newServer = serverList[i];
		if (seenList.includes(newServer)) continue;
		if (i != serverList.length - 1) {
			PrintServerInfo(newServer, indent, prefix + "├─", nextHack)
			ScanServer(newServer, seenList, indent + 1, prefix + "│    ", nextHack);
		}
		else {
			PrintServerInfo(newServer, indent, prefix + "└─", nextHack)
			ScanServer(newServer, seenList, indent + 1, prefix + "     ", nextHack);
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

function PrintServerInfo(serverName, indent, prefix, nextHack) {
	var indentString = prefix;
	var serverInfo = _ns.getServer(serverName); //Interface of requested server
	// Definition of Root Access Symbols
	if (controlSymbolTypeColor) {
		var hacked = (serverInfo.hasAdminRights) ? "\u2705" : "\u274C";
	} else {
		var hacked = (serverInfo.hasAdminRights) ? " \u2611 " : " \u2612 ";
	}
	var serverHackingLevel = serverInfo.requiredHackingSkill;
	var serverMinSecLevel = serverInfo.minDifficulty;
	var serverPortLevel = serverInfo.numOpenPortsRequired;
	var serverMaxRam = serverInfo.maxRam ;
	var serverMaxRamIndicator = ' ' + serverMaxRam + 'GB';
	var canHackIndicator = "";
	var backdoorIndicator = "";
	var portReqIndicator = "";
	var maxMoneyIndicator = "";
	var hasContractIndicator = "";

	if (_ns.getHackingLevel() >= serverHackingLevel && HackablePortsPlayer() >= serverPortLevel && !serverInfo.hasAdminRights) {
		canHackIndicator = "  >> !!!!!!!!!  CAN HACK  !!!!!!!!!"
	}
	//check for contracts
	if (_ns.ls(serverName, '.cct').length > 0) {
		hasContractIndicator = " >> Has Contract";
	}
	// Definition of Backdoor Symbols
	if (controlBackdoorIndicator && controlSymbolTypeColor) {
		backdoorIndicator = (serverInfo.backdoorInstalled) ? " [BD] " : " [X] ";
	} else if (controlBackdoorIndicator && !controlSymbolTypeColor) {
		backdoorIndicator = (serverInfo.backdoorInstalled) ? " [BD] " : " [NO BD] ";
	}
	// Definition of required Port Level indicator
	if (controlPortsRequiredIndicator) {
		portReqIndicator = " P" + serverPortLevel + " ";
	}
	// Definition of Maximum Money Indicator
	if (controlMaxMoneyIndicator) {
		//nFormat depreciated
		//maxMoneyIndicator = " [Max Money" + _ns.nFormat(serverInfo.moneyMax, "($ 0.00a)") + "] ";
		maxMoneyIndicator = " [Max Money $" + _ns.formatNumber(serverInfo.moneyMax, 2) + "]";
	}
	let statusColor = '';
	if(_ns.getHackingLevel() < serverHackingLevel){
		statusColor = colors.magenta;
	}
	let serverColor = '';
	if (serverOfInterest.includes(serverInfo.hostname)) {
		serverColor = colors.cyan;
	}
	if(serverInfo.requiredHackingSkill == nextHack) {
		serverColor = colors.white;
	}

	_ns.tprint(indentString + hacked + backdoorIndicator + serverColor + serverName + colors.reset + statusColor + " (" + serverHackingLevel + portReqIndicator + serverMinSecLevel + serverMaxRamIndicator +")" + maxMoneyIndicator + colors.reset + canHackIndicator + hasContractIndicator);
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
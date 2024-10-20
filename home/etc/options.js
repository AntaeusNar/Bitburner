/** Various runtime options for command_control.js */

export const baseDelay = 50; //base delay between batches and cycles in milliseconds // NOTE: decreasing below 200 causes bunching of scripts
export const maxScripts = 10000; //max number of deployable scripts.  > 10,000 seems to create realworld game crashes
export const budgetPercentageLimit = .5; // multipler for available budget.
export const paybackTimeLimit = 1 * 60 * 60; //Time in seconds for payback
export const bitNodeMultipliers = { //bitNodeMultipliers ->placeholder for bitnode info -> https://github.com/danielyxie/bitburner/blob/dev/src/BitNode/BitNode.tsx
  ServerGrowthRate: 1/Math.pow(1.02, 6),
  ScriptHackMoney: 1/Math.pow(1.02, 6),
  HackNetNodeMoneyBitNode: 1/Math.pow(1.02, 6),
};
export const serverOfIntrest = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z', 'w0r1d_d43m0n'];
export const colors = {
		black: "\u001b[30m",
		red: "\u001b[31m",
		green: "\u001b[32m",
		yellow: "\u001b[33m",
		blue: "\u001b[34m",
		magenta: "\u001b[35m",
		cyan: "\u001b[36m",
		white: "\u001b[37m",
		brightBlack: "\u001b[30;1m",
		brightRed: "\u001b[31;1m",
		brightGreen: "\u001b[32;1m",
		brightYellow: "\u001b[33;1m",
		brightBlue: "\u001b[34;1m",
		brightMagenta: "\u001b[35;1m",
		brightCyan: "\u001b[36;1m",
		brightWhite: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

export const currentBitNode = {
	n: 12,
	lvl: 2
};

// -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/Server/data/Constants.ts
export const ServerConstants = {
    // Base RAM costs
    BaseCostFor1GBOfRamHome: 32000,
    BaseCostFor1GBOfRamServer: 55000, //1 GB of RAM
    // Server-related constants
    HomeComputerMaxRam: 1073741824, // 2 ^ 30
    ServerBaseGrowthIncr: 0.03, // Unadjusted growth increment (growth rate is this * adjustment + 1)
    ServerMaxGrowthLog: 0.00349388925425578, // Maximum possible growth rate accounting for server security, precomputed as log1p(.0035)
    ServerFortifyAmount: 0.002, // Amount by which server's security increases when its hacked/grown
    ServerWeakenAmount: 0.05, // Amount by which server's security decreases when weakened
    PurchasedServerLimit: 25,
    PurchasedServerMaxRam: 1048576, // 2^20
};

export const serverOfInterest = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z', 'w0r1d_d43m0n'];
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
export const maxScripts = 20000; // more scripts then this running at one time will make your real PC sweat...
export const baseDelay = .5; //base delay between batches and cycles in sec // NOTE: decreasing below 200 causes bunching of scripts
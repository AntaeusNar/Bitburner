export const baseDelay = 50; //base delay between batches and cycles in milliseconds // NOTE: decreasing below 200 causes bunching of scripts
export const currentBitNode = {
	n: 12,
	lvl: 1
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
/** Operational Constants and options for Alice */
export const base_delay = 1; //base delay between batches and cycles in seconds
export const max_scripts = 10000; //max number of deployable scripts.  > 10,000 seems to create real world game crashes
export const SpecialServers = {
    FulcrumSecretTechnologies: "fulcrumassets",
    CyberSecServer: "CSEC",
    NiteSecServer: "avmnite-02h",
    TheBlackHandServer: "I.I.I.I",
    BitRunnersServer: "run4theh111z",
    TheDarkArmyServer: ".",
    DaedalusServer: "The-Cave",
    WorldDaemon: "w0r1d_d43m0n",
    DarkWeb: "darkweb",
}

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

// BitNode Info - Update as needed!!!
// -> https://github.com/bitburner-official/bitburner-src/blob/dev/src/BitNode/BitNodeMultipliers.ts
export const currentNodeMults = {
    /** Influences how quickly the player's agility level (not exp) scales */
    AgilityLevelMultiplier: 1,

    /** Influences the base cost to purchase an augmentation. */
    AugmentationMoneyCost: 1,

    /** Influences the base rep the player must have with a faction to purchase an augmentation. */
    AugmentationRepCost: 1,

    /** Influences how quickly the player can gain rank within Bladeburner. */
    BladeburnerRank: 1,

    /** Influences the cost of skill levels from Bladeburner. */
    BladeburnerSkillCost: 1,

    /** Influences how quickly the player's charisma level (not exp) scales */
    CharismaLevelMultiplier: 1,

    /** Influences the experience gained for each ability when a player completes a class. */
    ClassGymExpGain: 1,

    /** Influences the amount of money gained from completing Coding Contracts. */
    CodingContractMoney: 1,

    /** Influences the experience gained for each ability when the player completes working their job. */
    CompanyWorkExpGain: 1,

    /** Influences how much money the player earns when completing working their job. */
    CompanyWorkMoney: 1,

    /** Influences how much rep the player gains when performing work for a company. */
    CompanyWorkRepGain: 1,

    /** Influences the amount of divisions a corporation can have at the same time. */
    CorporationDivisions: 1,

    /** Influences profits from corporation dividends and selling shares. */
    CorporationSoftcap: 1,

    /** Influences the valuation of corporations created by the player. */
    CorporationValuation: 1,

    /** Influences the base experience gained for each ability when the player commits a crime. */
    CrimeExpGain: 1,

    /** Influences the base money gained when the player commits a crime. */
    CrimeMoney: 1,

    /** Influences the success chance of committing crimes */
    CrimeSuccessRate: 1,

    /** Influences how many Augmentations you need in order to get invited to the Daedalus faction */
    DaedalusAugsRequirement: 30,

    /** Influences how quickly the player's defense level (not exp) scales */
    DefenseLevelMultiplier: 1,

    /** Influences how quickly the player's dexterity level (not exp) scales */
    DexterityLevelMultiplier: 1,

    /** Influences how much rep the player gains in each faction simply by being a member. */
    FactionPassiveRepGain: 1,

    /** Influences the experience gained for each ability when the player completes work for a Faction. */
    FactionWorkExpGain: 1,

    /** Influences how much rep the player gains when performing work for a faction or donating to it. */
    FactionWorkRepGain: 1,

    /** Influences how much it costs to unlock the stock market's 4S Market Data API */
    FourSigmaMarketDataApiCost: 1,

    /** Influences how much it costs to unlock the stock market's 4S Market Data (NOT API) */
    FourSigmaMarketDataCost: 1,

    /** Influences the respect gain and money gain of your gang. */
    GangSoftcap: 1,

    /** Percentage of unique augs that the gang has. */
    GangUniqueAugs: 1,

    /** Percentage multiplier on the effect of the IPvGO rewards  **/
    GoPower: 1,

    /** Influences the experienced gained when hacking a server. */
    HackExpGain: 1,

    /** Influences how quickly the player's hacking level (not experience) scales */
    HackingLevelMultiplier: 1,

    /** Influences how quickly the player's hack(), grow() and weaken() calls run */
    HackingSpeedMultiplier: 1,

    /**
     * Influences how much money is produced by Hacknet Nodes.
     * Influences the hash rate of Hacknet Servers (unlocked in BitNode-9)
     */
    HacknetNodeMoney: 1,

    /** Influences how much money it costs to upgrade your home computer's RAM */
    HomeComputerRamCost: 1,

    /** Influences how much money is gained when the player infiltrates a company. */
    InfiltrationMoney: 1,

    /** Influences how much rep the player can gain from factions when selling stolen documents and secrets */
    InfiltrationRep: 1,

    /**
     * Influences how much money the player actually gains when they hack a server via the terminal. This is different
     * from ScriptHackMoney. When the player hack a server via the terminal, the amount of money in that server is
     * reduced, but they do not gain that same amount.
     */
    ManualHackMoney: 1,

    /** Influence how much it costs to purchase a server */
    PurchasedServerCost: 1,

    /** Influence how much it costs to purchase a server */
    PurchasedServerSoftcap: 1,

    /** Influences the maximum number of purchased servers you can have */
    PurchasedServerLimit: 1,

    /** Influences the maximum allowed RAM for a purchased server */
    PurchasedServerMaxRam: 1,

    /** Influences the minimum favor the player must have with a faction before they can donate to gain rep. */
    RepToDonateToFaction: 1,

    /** Influences how much money is stolen from a server when the player performs a hack against it. */
    ScriptHackMoney: 1,

    /**
     * Influences how much money the player actually gains when a script hacks a server. This is different from
     * ScriptHackMoney. When a script hacks a server, the amount of money in that server is reduced, but the player does
     * not gain that same amount.
     */
    ScriptHackMoneyGain: 1,

    /** Influences the growth percentage per cycle against a server. */
    ServerGrowthRate: 1,

    /** Influences the maximum money that a server can grow to. */
    ServerMaxMoney: 1,

    /** Influences the initial money that a server starts with. */
    ServerStartingMoney: 1,

    /** Influences the initial security level (hackDifficulty) of a server. */
    ServerStartingSecurity: 1,

    /** Influences the weaken amount per invocation against a server. */
    ServerWeakenRate: 1,

    /** Influences how quickly the player's strength level (not exp) scales */
    StrengthLevelMultiplier: 1,

    /** Influences the power of the gift. */
    StaneksGiftPowerMultiplier: 1,

    /** Influences the size of the gift. */
    StaneksGiftExtraSize: 0,

    /** Influences the hacking skill required to backdoor the world daemon. */
    WorldDaemonDifficulty: 1,
}
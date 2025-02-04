/**
 * @typedef {Object} BitNodeMultipliers
 * @property {number} AgilityLevelMultiplier - Influences how quickly the player's agility level (not exp) scales.
 * @property {number} AugmentationMoneyCost - Influences the base cost to purchase an augmentation.
 * @property {number} AugmentationRepCost - Influences the base rep the player must have with a faction to purchase an augmentation.
 * @property {number} BladeburnerRank - Influences how quickly the player can gain rank within Bladeburner.
 * @property {number} BladeburnerSkillCost - Influences the cost of skill levels from Bladeburner.
 * @property {number} CharismaLevelMultiplier - Influences how quickly the player's charisma level (not exp) scales.
 * @property {number} ClassGymExpGain - Influences the experience gained for each ability when a player completes a class.
 * @property {number} CodingContractMoney - Influences the amount of money gained from completing Coding Contracts.
 * @property {number} CompanyWorkExpGain - Influences the experience gained for each ability when the player completes working their job.
 * @property {number} CompanyWorkMoney - Influences how much money the player earns when completing working their job.
 * @property {number} CompanyWorkRepGain - Influences how much rep the player gains when performing work for a company.
 * @property {number} CorporationDivisions - Influences the amount of divisions a corporation can have at the same time.
 * @property {number} CorporationSoftcap - Influences profits from corporation dividends and selling shares.
 * @property {number} CorporationValuation - Influences the valuation of corporations created by the player.
 * @property {number} CrimeExpGain - Influences the base experience gained for each ability when the player commits a crime.
 * @property {number} CrimeMoney - Influences the base money gained when the player commits a crime.
 * @property {number} CrimeSuccessRate - Influences the success chance of committing crimes.
 * @property {number} DaedalusAugsRequirement - Influences how many Augmentations you need in order to get invited to the Daedalus faction.
 * @property {number} DefenseLevelMultiplier - Influences how quickly the player's defense level (not exp) scales.
 * @property {number} DexterityLevelMultiplier - Influences how quickly the player's dexterity level (not exp) scales.
 * @property {number} FactionPassiveRepGain - Influences how much rep the player gains in each faction simply by being a member.
 * @property {number} FactionWorkExpGain - Influences the experience gained for each ability when the player completes work for a Faction.
 * @property {number} FactionWorkRepGain - Influences how much rep the player gains when performing work for a faction or donating to it.
 * @property {number} FourSigmaMarketDataApiCost - Influences how much it costs to unlock the stock market's 4S Market Data API.
 * @property {number} FourSigmaMarketDataCost - Influences how much it costs to unlock the stock market's 4S Market Data (NOT API).
 * @property {number} GangSoftcap - Influences the respect gain and money gain of your gang.
 * @property {number} GangUniqueAugs - Percentage of unique augs that the gang has.
 * @property {number} GoPower - Percentage multiplier on the effect of the IPvGO rewards.
 * @property {number} HackExpGain - Influences the experience gained when hacking a server.
 * @property {number} HackingLevelMultiplier - Influences how quickly the player's hacking level (not experience) scales.
 * @property {number} HackingSpeedMultiplier - Influences how quickly the player's hack(), grow() and weaken() calls run.
 * @property {number} HacknetNodeMoney - Influences how much money is produced by Hacknet Nodes.
 * @property {number} HomeComputerRamCost - Influences how much money it costs to upgrade your home computer's RAM.
 * @property {number} InfiltrationMoney - Influences how much money is gained when the player infiltrates a company.
 * @property {number} InfiltrationRep - Influences how much rep the player can gain from factions when selling stolen documents and secrets.
 * @property {number} ManualHackMoney - Influences how much money the player actually gains when they hack a server via the terminal.
 * @property {number} PurchasedServerCost - Influence how much it costs to purchase a server.
 * @property {number} PurchasedServerSoftcap - Influence how much it costs to purchase a server.
 * @property {number} PurchasedServerLimit - Influences the maximum number of purchased servers you can have.
 * @property {number} PurchasedServerMaxRam - Influences the maximum allowed RAM for a purchased server.
 * @property {number} RepToDonateToFaction - Influences the minimum favor the player must have with a faction before they can donate to gain rep.
 * @property {number} ScriptHackMoney - Influences how much money is stolen from a server when the player performs a hack against it.
 * @property {number} ScriptHackMoneyGain - Influences how much money the player actually gains when a script hacks a server.
 * @property {number} ServerGrowthRate - Influences the growth percentage per cycle against a server.
 * @property {number} ServerMaxMoney - Influences the maximum money that a server can grow to.
 * @property {number} ServerStartingMoney - Influences the initial money that a server starts with.
 * @property {number} ServerStartingSecurity - Influences the initial security level (hackDifficulty) of a server.
 * @property {number} ServerWeakenRate - Influences the weaken amount per invocation against a server.
 * @property {number} StrengthLevelMultiplier - Influences how quickly the player's strength level (not exp) scales.
 * @property {number} StaneksGiftPowerMultiplier - Influences the power of the gift.
 * @property {number} StaneksGiftExtraSize - Influences the size of the gift.
 * @property {number} WorldDaemonDifficulty - Influences the hacking skill required to backdoor the world daemon.
 */


const defaultBitNode = {
    AgilityLevelMultiplier: 1,
    AugmentationMoneyCost: 1,
    AugmentationRepCost: 1,
    BladeburnerRank: 1,
    BladeburnerSkillCost: 1,
    CharismaLevelMultiplier: 1,
    ClassGymExpGain: 1,
    CodingContractMoney: 1,
    CompanyWorkExpGain: 1,
    CompanyWorkMoney: 1,
    CompanyWorkExpGain: 1,
    CorporationDivisions: 1,
    CorporationSoftcap: 1,
    CorporationValuation: 1,
    CrimeExpGain: 1,
    CrimeMoney: 1,
    CrimeSuccessRate: 1,
    DaedalusAugsRequirement: 1,
    DefenseLevelMultiplier: 1,
    DexterityLevelMultiplier: 1,
    FactionPassiveRepGain: 1,
    FactionWorkExpGain: 1,
    FactionWorkRepGain: 1,
    FourSigmaMarketDataCost: 1,
    FourSigmaMarketDataCost: 1,
    GangSoftcap: 1,
    GangUniqueAugs: 1,
    GoPower: 1,
    HackExpGain: 1,
    HackingLevelMultiplier: 1,
    HackingSpeedMultiplier: 1,
    HacknetNodeMoney: 1,
    HomeComputerRamCost: 1,
    InfiltrationMoney: 1,
    InfiltrationRep: 1,
    ManualHackMoney: 1,
    PurchasedServerCost: 1,
    PurchasedServerSoftcap: 1,
    PurchasedServerLimit: 1,
    PurchasedServerMaxRam: 1,
    RepToDonateToFaction: 1,
    ScriptHackMoney: 1,
    ScriptHackMoneyGain: 1,
    ServerGrowthRate: 1,
    ServerMaxMoney: 1,
    ServerStartingMoney: 1,
    ServerWeakenRate: 1,
    StrengthLevelMultiplier: 1,
    StaneksGiftPowerMultiplier: 1,
    StaneksGiftExtraSize: 0,
    WorldDaemonDifficulty: 1
}

/** Pulls the requested BitNode info
 * @param {number} n BitNode Number
 * @param {number} lvl Level of BitNode 12
 * @returns {BitNodeMultipliers}
 */
export function localBitNodeMultipliers(n, lvl) {
    let workingBitNode = defaultBitNode;
    switch (n) {
        case 1: {
            return workingBitNode;
        }
        case 2: {
            workingBitNode.HackingLevelMultiplier = 0.8;
            workingBitNode.ServerGrowthRate = 0.8;
            workingBitNode.ServerMaxMoney = 0.08;
            workingBitNode.ServerStartingMoney = 0.4;
            workingBitNode.PurchasedServerSoftcap = 1.3;
            workingBitNode.CrimeMoney = 3;
            workingBitNode.FactionPassiveRepGain = 0;
            workingBitNode.FactionWorkRepGain = 0.5;
            workingBitNode.CorporationSoftcap = 0.9;
            workingBitNode.CorporationDivisions = 0.9;
            workingBitNode.InfiltrationMoney = 3;
            workingBitNode.StaneksGiftPowerMultiplier = 2;
            workingBitNode.StaneksGiftExtraSize = -6;
            workingBitNode.WorldDaemonDifficulty = 5;
            return workingBitNode;
        }
        case 3: {
            workingBitNode.HackingLevelMultiplier = 0.8; 
            workingBitNode.ServerGrowthRate = 0.2;
            workingBitNode.ServerMaxMoney = 0.04;
            workingBitNode.ServerStartingMoney = 0.2;
            workingBitNode.HomeComputerRamCost = 1.5;  
            workingBitNode.PurchasedServerCost = 2;
            workingBitNode.PurchasedServerSoftcap = 1.3; 
            workingBitNode.CompanyWorkMoney = 0.25;
            workingBitNode.CrimeMoney = 0.25;
            workingBitNode.HacknetNodeMoney = 0.25;
            workingBitNode.ScriptHackMoney = 0.2; 
            workingBitNode.RepToDonateToFaction = 0.5; 
            workingBitNode.AugmentationMoneyCost = 3;
            workingBitNode.AugmentationRepCost = 3; 
            workingBitNode.GangSoftcap = 0.9;
            workingBitNode.GangUniqueAugs = 0.5;
            workingBitNode.StaneksGiftPowerMultiplier = 0.75;
            workingBitNode.StaneksGiftExtraSize = -2;
            workingBitNode.WorldDaemonDifficulty = 2;
            return workingBitNode;
        }
        case 4: {
            workingBitNode.ServerMaxMoney = 0.1125;
            workingBitNode.ServerStartingMoney = 0.75;  
            workingBitNode.PurchasedServerSoftcap = 1.2; 
            workingBitNode.CompanyWorkMoney = 0.1;
            workingBitNode.CrimeMoney = 0.2;
            workingBitNode.HacknetNodeMoney = 0.05;
            workingBitNode.ScriptHackMoney = 0.2; 
            workingBitNode.ClassGymExpGain = 0.5;
            workingBitNode.CompanyWorkExpGain = 0.5;
            workingBitNode.CrimeExpGain = 0.5;
            workingBitNode.FactionWorkExpGain = 0.5;
            workingBitNode.HackExpGain = 0.4;  
            workingBitNode.FactionWorkRepGain = 0.75; 
            workingBitNode.GangUniqueAugs = 0.5;
            workingBitNode.StaneksGiftPowerMultiplier = 1.5;
            workingBitNode.StaneksGiftExtraSize = 0;
            workingBitNode.WorldDaemonDifficulty = 3;
            return workingBitNode;
        }
        case 5: {
            workingBitNode.ServerStartingSecurity = 2;
            workingBitNode.ServerStartingMoney = 0.5;  
            workingBitNode.PurchasedServerSoftcap = 1.2; 
            workingBitNode.CrimeMoney = 0.5;
            workingBitNode.HacknetNodeMoney = 0.2;
            workingBitNode.ScriptHackMoney = 0.15; 
            workingBitNode.HackExpGain = 0.5;  
            workingBitNode.AugmentationMoneyCost = 2; 
            workingBitNode.InfiltrationMoney = 1.5;
            workingBitNode.InfiltrationRep = 1.5; 
            workingBitNode.CorporationValuation = 0.75;
            workingBitNode.CorporationDivisions = 0.75; 
            workingBitNode.GangUniqueAugs = 0.5;
            workingBitNode.StaneksGiftPowerMultiplier = 1.3;
            workingBitNode.StaneksGiftExtraSize = 0;
            workingBitNode.WorldDaemonDifficulty = 1.5;
            return workingBitNode;
        }
        case 6: {
            workingBitNode.HackingLevelMultiplier = 0.35; 
            workingBitNode.ServerMaxMoney = 0.2;
            workingBitNode.ServerStartingMoney = 0.5;
            workingBitNode.ServerStartingSecurity = 1.5; 
            workingBitNode.PurchasedServerSoftcap = 2; 
            workingBitNode.CompanyWorkMoney = 0.5;
            workingBitNode.CrimeMoney = 0.75;
            workingBitNode.HacknetNodeMoney = 0.2;
            workingBitNode.ScriptHackMoney = 0.75;  
            workingBitNode.HackExpGain = 0.25; 
            workingBitNode.InfiltrationMoney = 0.75;  
            workingBitNode.CorporationValuation = 0.2;
            workingBitNode.CorporationSoftcap = 0.9;
            workingBitNode.CorporationDivisions = 0.8; 
            workingBitNode.GangSoftcap = 0.7;
            workingBitNode.GangUniqueAugs = 0.2; 
            workingBitNode.DaedalusAugsRequirement = 35;
            workingBitNode.StaneksGiftPowerMultiplier = 0.5;
            workingBitNode.StaneksGiftExtraSize = 2;
            workingBitNode.WorldDaemonDifficulty = 2;
            return workingBitNode;
        }
        case 7: {
            workingBitNode.HackingLevelMultiplier = 0.35; 
            workingBitNode.ServerMaxMoney = 0.2;
            workingBitNode.ServerStartingMoney = 0.5;
            workingBitNode.ServerStartingSecurity = 1.5;  
            workingBitNode.PurchasedServerSoftcap = 2; 
            workingBitNode.CompanyWorkMoney = 0.5;
            workingBitNode.CrimeMoney = 0.75;
            workingBitNode.HacknetNodeMoney = 0.2;
            workingBitNode.ScriptHackMoney = 0.5;  
            workingBitNode.HackExpGain = 0.25;  
            workingBitNode.AugmentationMoneyCost = 3;  
            workingBitNode.InfiltrationMoney = 0.75; 
            workingBitNode.FourSigmaMarketDataCost = 2;
            workingBitNode.FourSigmaMarketDataApiCost = 2;  
            workingBitNode.CorporationValuation = 0.2;
            workingBitNode.CorporationSoftcap = 0.9;
            workingBitNode.CorporationDivisions = 0.8; 
            workingBitNode.BladeburnerRank = 0.6;
            workingBitNode.BladeburnerSkillCost = 2; 
            workingBitNode.GangSoftcap = 0.7;
            workingBitNode.GangUniqueAugs = 0.2;  
            workingBitNode.DaedalusAugsRequirement = 35; 
            workingBitNode.StaneksGiftPowerMultiplier = 0.9;
            workingBitNode.StaneksGiftExtraSize = -1;
            workingBitNode.WorldDaemonDifficulty = 2;
            return workingBitNode;
        }
        case 8: {
            workingBitNode.PurchasedServerSoftcap = 4;  
            workingBitNode.CompanyWorkMoney = 0;
            workingBitNode.CrimeMoney = 0;
            workingBitNode.HacknetNodeMoney = 0;
            workingBitNode.ManualHackMoney = 0;
            workingBitNode.ScriptHackMoney = 0.3;
            workingBitNode.ScriptHackMoneyGain = 0;
            workingBitNode.CodingContractMoney = 0;  
            workingBitNode.RepToDonateToFaction = 0;  
            workingBitNode.InfiltrationMoney = 0;  
            workingBitNode.CorporationValuation = 0;
            workingBitNode.CorporationSoftcap = 0;
            workingBitNode.CorporationDivisions = 0; 
            workingBitNode.BladeburnerRank = 0; 
            workingBitNode.GangSoftcap = 0;
            workingBitNode.GangUniqueAugs = 0;
            workingBitNode.StaneksGiftExtraSize = -99;
            return workingBitNode;
        }
        case 9: {
            workingBitNode.HackingLevelMultiplier = 0.5;
            workingBitNode.StrengthLevelMultiplier = 0.45;
            workingBitNode.DefenseLevelMultiplier = 0.45;
            workingBitNode.DexterityLevelMultiplier = 0.45;
            workingBitNode.AgilityLevelMultiplier = 0.45;
            workingBitNode.CharismaLevelMultiplier = 0.45;
            workingBitNode.ServerMaxMoney = 0.01;
            workingBitNode.ServerStartingMoney = 0.1;
            workingBitNode.ServerStartingSecurity = 2.5;
            workingBitNode.HomeComputerRamCost = 5;
            workingBitNode.PurchasedServerLimit = 0;
            workingBitNode.CrimeMoney = 0.5;
            workingBitNode.ScriptHackMoney = 0.1;
            workingBitNode.HackExpGain = 0.05;
            workingBitNode.FourSigmaMarketDataCost = 5;
            workingBitNode.FourSigmaMarketDataApiCost = 4;
            workingBitNode.CorporationValuation = 0.5;
            workingBitNode.CorporationSoftcap = 0.75;
            workingBitNode.CorporationDivisions = 0.8;
            workingBitNode.BladeburnerRank = 0.9;
            workingBitNode.BladeburnerSkillCost = 1.2;
            workingBitNode.GangSoftcap = 0.8;
            workingBitNode.GangUniqueAugs = 0.25;
            workingBitNode.StaneksGiftPowerMultiplier = 0.5;
            workingBitNode.StaneksGiftExtraSize = 2;
            workingBitNode.WorldDaemonDifficulty = 2;
            return workingBitNode;
        }
        case 10: {
            workingBitNode.HackingLevelMultiplier = 0.35;
            workingBitNode.StrengthLevelMultiplier = 0.4;
            workingBitNode.DefenseLevelMultiplier = 0.4;
            workingBitNode.DexterityLevelMultiplier = 0.4;
            workingBitNode.AgilityLevelMultiplier = 0.4;
            workingBitNode.CharismaLevelMultiplier = 0.4;
            workingBitNode.HomeComputerRamCost = 1.5;
            workingBitNode.PurchasedServerCost = 5;
            workingBitNode.PurchasedServerSoftcap = 1.1;
            workingBitNode.PurchasedServerLimit = 0.6;
            workingBitNode.PurchasedServerMaxRam = 0.5;
            workingBitNode.CompanyWorkMoney = 0.5;
            workingBitNode.CrimeMoney = 0.5;
            workingBitNode.HacknetNodeMoney = 0.5;
            workingBitNode.ManualHackMoney = 0.5;
            workingBitNode.ScriptHackMoney = 0.5;
            workingBitNode.CodingContractMoney = 0.5;
            workingBitNode.AugmentationMoneyCost = 5;
            workingBitNode.AugmentationRepCost = 2;
            workingBitNode.InfiltrationMoney = 0.5;
            workingBitNode.CorporationValuation = 0.5;
            workingBitNode.CorporationSoftcap = 0.9;
            workingBitNode.CorporationDivisions = 0.9;
            workingBitNode.BladeburnerRank = 0.8;
            workingBitNode.GangSoftcap = 0.9;
            workingBitNode.GangUniqueAugs = 0.25;
            workingBitNode.StaneksGiftPowerMultiplier = 0.75;
            workingBitNode.StaneksGiftExtraSize = -3;
            workingBitNode.WorldDaemonDifficulty = 2;
            return workingBitNode;
        }
        case 11: {
            workingBitNode.HackingLevelMultiplier = 0.6; 
            workingBitNode.ServerGrowthRate = 0.2;
            workingBitNode.ServerMaxMoney = 0.01;
            workingBitNode.ServerStartingMoney = 0.1;
            workingBitNode.ServerWeakenRate = 2; 
            workingBitNode.PurchasedServerSoftcap = 2;
            workingBitNode.CompanyWorkMoney = 0.5;
            workingBitNode.CrimeMoney = 3;
            workingBitNode.HacknetNodeMoney = 0.1;
            workingBitNode.CodingContractMoney = 0.25;
            workingBitNode.HackExpGain = 0.5;
            workingBitNode.AugmentationMoneyCost = 2;
            workingBitNode.InfiltrationMoney = 2.5;
            workingBitNode.InfiltrationRep = 2.5;
            workingBitNode.FourSigmaMarketDataCost = 4;
            workingBitNode.FourSigmaMarketDataApiCost = 4;
            workingBitNode.CorporationValuation = 0.1;
            workingBitNode.CorporationSoftcap = 0.9;
            workingBitNode.CorporationDivisions = 0.9;
            workingBitNode.GangUniqueAugs = 0.75;
            workingBitNode.WorldDaemonDifficulty = 1.5;
            return workingBitNode;
        }
        case 12: {
            const inc = Math.pow(1.02, lvl);
            const dec = 1 / inc;
            workingBitNode.DaedalusAugsRequirement = Math.floor(Math.min(30 + inc, 40));
            workingBitNode.HackingLevelMultiplier = dec;
            workingBitNode.StrengthLevelMultiplier = dec;
            workingBitNode.DefenseLevelMultiplier = dec;
            workingBitNode.DexterityLevelMultiplier = dec;
            workingBitNode.AgilityLevelMultiplier = dec;
            workingBitNode.CharismaLevelMultiplier = dec;
            workingBitNode.ServerGrowthRate = dec;
            workingBitNode.ServerMaxMoney = dec * dec;
            workingBitNode.ServerStartingMoney = dec;
            workingBitNode.ServerWeakenRate = dec; 
            workingBitNode.ServerStartingSecurity = 1.5; //Does not scale; otherwise security might start at 300+
            workingBitNode.HomeComputerRamCost = inc; 
            workingBitNode.PurchasedServerCost = inc;
            workingBitNode.PurchasedServerSoftcap = inc;
            workingBitNode.PurchasedServerLimit = dec;
            workingBitNode.PurchasedServerMaxRam = dec;
            workingBitNode.CompanyWorkMoney = dec;
            workingBitNode.CrimeMoney = dec;
            workingBitNode.HacknetNodeMoney = dec;
            workingBitNode.ManualHackMoney = dec;
            workingBitNode.ScriptHackMoney = dec;
            workingBitNode.CodingContractMoney = dec;
            workingBitNode.ClassGymExpGain = dec;
            workingBitNode.CompanyWorkExpGain = dec;
            workingBitNode.CrimeExpGain = dec;
            workingBitNode.FactionWorkExpGain = dec;
            workingBitNode.HackExpGain = dec;
            workingBitNode.FactionPassiveRepGain = dec;
            workingBitNode.FactionWorkRepGain = dec;
            workingBitNode.RepToDonateToFaction = inc;
            workingBitNode.AugmentationMoneyCost = inc;
            workingBitNode.AugmentationRepCost = inc;
            workingBitNode.InfiltrationMoney = dec;
            workingBitNode.InfiltrationRep = dec; 
            workingBitNode.FourSigmaMarketDataCost = inc;
            workingBitNode.FourSigmaMarketDataApiCost = inc;
            workingBitNode.CorporationValuation = dec;
            workingBitNode.CorporationSoftcap = 0.8;
            workingBitNode.CorporationDivisions = 0.5;
            workingBitNode.BladeburnerRank = dec;
            workingBitNode.BladeburnerSkillCost = inc;
            workingBitNode.GangSoftcap = 0.8;
            workingBitNode.GangUniqueAugs = dec;
            workingBitNode.StaneksGiftPowerMultiplier = inc;
            workingBitNode.StaneksGiftExtraSize = inc;
            workingBitNode.WorldDaemonDifficulty = inc;
            return workingBitNode;
        }
        case 13: {
            workingBitNode.HackingLevelMultiplier = 0.25;
            workingBitNode.StrengthLevelMultiplier = 0.7;
            workingBitNode.DefenseLevelMultiplier = 0.7;
            workingBitNode.DexterityLevelMultiplier = 0.7;
            workingBitNode.AgilityLevelMultiplier = 0.7;
            workingBitNode.PurchasedServerSoftcap = 1.6;
            workingBitNode.ServerMaxMoney = 0.3375;
            workingBitNode.ServerStartingMoney = 0.75;
            workingBitNode.ServerStartingSecurity = 3;
            workingBitNode.CompanyWorkMoney = 0.4;
            workingBitNode.CrimeMoney = 0.4;
            workingBitNode.HacknetNodeMoney = 0.4;
            workingBitNode.ScriptHackMoney = 0.2;
            workingBitNode.CodingContractMoney = 0.4;
            workingBitNode.ClassGymExpGain = 0.5;
            workingBitNode.CompanyWorkExpGain = 0.5;
            workingBitNode.CrimeExpGain = 0.5;
            workingBitNode.FactionWorkExpGain = 0.5;
            workingBitNode.HackExpGain = 0.1;
            workingBitNode.FactionWorkRepGain = 0.6;
            workingBitNode.FourSigmaMarketDataCost = 10;
            workingBitNode.FourSigmaMarketDataApiCost = 10;
            workingBitNode.CorporationValuation = 0.001;
            workingBitNode.CorporationSoftcap = 0.4;
            workingBitNode.CorporationDivisions = 0.4;
            workingBitNode.BladeburnerRank = 0.45;
            workingBitNode.BladeburnerSkillCost = 2;
            workingBitNode.GangSoftcap = 0.3;
            workingBitNode.GangUniqueAugs = 0.1;
            workingBitNode.StaneksGiftPowerMultiplier = 2;
            workingBitNode.StaneksGiftExtraSize = 1;
            workingBitNode.WorldDaemonDifficulty = 3;
            return workingBitNode;
        }
        case 14: {
            workingBitNode.GoPower = 4; 
            workingBitNode.HackingLevelMultiplier = 0.4;
            workingBitNode.HackingSpeedMultiplier = 0.3;
            workingBitNode.ServerMaxMoney = 0.7;
            workingBitNode.ServerStartingMoney = 0.5;
            workingBitNode.ServerStartingSecurity = 1.5; 
            workingBitNode.CrimeMoney = 0.75;
            workingBitNode.CrimeSuccessRate = 0.4;
            workingBitNode.HacknetNodeMoney = 0.25;
            workingBitNode.ScriptHackMoney = 0.3;  
            workingBitNode.StrengthLevelMultiplier = 0.5;
            workingBitNode.DexterityLevelMultiplier = 0.5;
            workingBitNode.AgilityLevelMultiplier = 0.5;
            workingBitNode.DefenseLevelMultiplier = 0.5; 
            workingBitNode.AugmentationMoneyCost = 1.5;
            workingBitNode.InfiltrationMoney = 0.75;
            workingBitNode.FactionWorkRepGain = 0.2;
            workingBitNode.CompanyWorkRepGain = 0.2;
            workingBitNode.CorporationValuation = 0.4;
            workingBitNode.CorporationSoftcap = 0.9;
            workingBitNode.CorporationDivisions = 0.8;
            workingBitNode.BladeburnerRank = 0.6;
            workingBitNode.BladeburnerSkillCost = 2;
            workingBitNode.GangSoftcap = 0.7;
            workingBitNode.GangUniqueAugs = 0.4;
            workingBitNode.StaneksGiftPowerMultiplier = 0.5;
            workingBitNode.StaneksGiftExtraSize = -1;
            workingBitNode.WorldDaemonDifficulty = 5;
            return workingBitNode;
        }
        default: {
            throw new Error("Invalid BitNode Number");
        }
    }
}

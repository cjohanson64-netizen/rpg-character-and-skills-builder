import blankSource from "./characters/blank.tat?raw";
import bossSource from "./characters/boss.tat?raw";
import clericSource from "./characters/cleric.tat?raw";
import goblinSource from "./characters/goblin.tat?raw";
import ratSource from "./characters/rat.tat?raw";
import rogueSource from "./characters/rogue.tat?raw";
import spiderSource from "./characters/spider.tat?raw";
import viperSource from "./characters/viper.tat?raw";
import villagerSource from "./characters/villager.tat?raw";
import warriorSource from "./characters/warrior.tat?raw";
import wizardSource from "./characters/wizard.tat?raw";

export const characterTemplates = [
  {
    id: "blank",
    label: "Blank Character",
    characterName: "blankCharacter",
    source: blankSource,
  },
  {
    id: "warrior",
    label: "Warrior",
    characterName: "warriorCharacter",
    source: warriorSource,
  },
  {
    id: "wizard",
    label: "Wizard",
    characterName: "wizardCharacter",
    source: wizardSource,
  },
  {
    id: "rogue",
    label: "Rogue",
    characterName: "rogueCharacter",
    source: rogueSource,
  },
  {
    id: "cleric",
    label: "Cleric",
    characterName: "clericCharacter",
    source: clericSource,
  },
  {
    id: "villager",
    label: "Villager",
    characterName: "villagerCharacter",
    source: villagerSource,
  },
  {
    id: "goblin",
    label: "Goblin",
    characterName: "goblinCharacter",
    source: goblinSource,
  },
  {
    id: "spider",
    label: "Spider",
    characterName: "spiderCharacter",
    source: spiderSource,
  },
  {
    id: "rat",
    label: "Rat",
    characterName: "ratCharacter",
    source: ratSource,
  },
  {
    id: "viper",
    label: "Viper",
    characterName: "viperCharacter",
    source: viperSource,
  },
  {
    id: "boss",
    label: "Boss",
    characterName: "bossCharacter",
    source: bossSource,
  },
];

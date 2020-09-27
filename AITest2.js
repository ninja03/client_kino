import {KinoUtil} from "./KinoUtil.js";
import {KinoAI} from "./KinoAI.js";
import {BeamSearch} from "./BeamSearch.js";

const logname = "./board/10x10.log";

const gameInfo = KinoUtil.load(logname, 0);
const game = KinoUtil.info2Game(gameInfo);
KinoUtil.printBoard(game);
let ai = new KinoAI();
console.log(ai.think(game, 0));


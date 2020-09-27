import {KinoUtil} from "./KinoUtil.js";
import {KinoAI} from "./KinoAI.js";
import {BeamSearch} from "./BeamSearch.js";

const logname = "./log/972ff13c-474e-46fd-ac41-ff99c185c4a8-player0.log";

const gameInfo = KinoUtil.load(logname, 1);

for (let i = 19; i < 20; i++) {
    const gameInfo = KinoUtil.load(logname, i);
    const game = KinoUtil.info2Game(gameInfo);
    KinoUtil.printBoard(game);
    if (i >= 1) {
        console.log("ターン: ", i, gameInfo.log[gameInfo.log.length - 1][0].actions.find(a => a.agentId === 5));
    }
    console.log("結果", new BeamSearch().search(game, 0, 5));
}
/*
let ai = new KinoAI();
console.log(ai.think(game, 0));
 */


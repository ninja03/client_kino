import { Action, Board, Field, Kakomimasu } from "../Kakomimasu.js";
import { sleep } from "../client_deno/client_util.js";
import {KinoUtil} from "./KinoUtil.js";

// const logname = "test.log";
const logname = "board/10x10.log";

const gameInfo = KinoUtil.load(logname, 0);
const masterGame = KinoUtil.info2Game(gameInfo);

const actions = KinoUtil.buildActions(masterGame, 0);
console.log("すべての手\n", actions, "\n");

const pat = new Array(masterGame.board.nagent);
for (let aid = 0; aid < masterGame.board.nagent; aid++) {
  pat[aid] = 0;
}
while (true) {
  const game = KinoUtil.info2Game(gameInfo);
  // 組み合わせ
  const act = [];
  for (let aid = 0; aid < game.board.nagent; aid++) {
    if (actions[aid][pat[aid]] !== null) {
      act.push(actions[aid][pat[aid]]);
    }
  }
  // console.log(pat, act);
  game.players[0].setActions(act);
  game.players[1].setActions([]);
  game.nextTurn();
  console.log(" = ", game.field.getPoints());

  // 次の手
  let aid;
  for (aid = 0; aid < game.board.nagent; aid++) {
    pat[aid]++;
    if (pat[aid] < actions[aid].length) {
      break;
    }
    pat[aid] = 0;
  }
  if (aid === game.board.nagent) {
    break;
  }

}

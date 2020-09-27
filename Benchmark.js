import {KinoUtil} from "./KinoUtil.js";
import {KinoAI} from "./KinoAI.js";
import {A4AI} from "./A4AI.js";

const logname = "./log/5c025b28-a686-4cc4-ba89-98fd9b383855-player1.log";
const infos = JSON.parse(Deno.readTextFileSync(logname));

let ai1 = new KinoAI();
ai1.bs.naname = false;
ai1.bs.maxDepth = 4;
ai1.bs.maxWidth = 60;
ai1.offseton = true;

let ai2 = new KinoAI();
ai2.bs.naname = false;
ai2.bs.maxDepth = 3;
ai2.bs.maxWidth = 60;
ai2.offseton = true;

let win = [0, 0];
let battlePoint = [0, 0];
const battleNum = 10;
for (let i = 0; i < battleNum; i++) {
  const game = KinoUtil.info2Game(infos[0]);
  while (!game.ending) {
    // console.log("game.turn", game.turn)
    const kact = ai1.think(game, 0);
    /*
    if (battleNum == 1) {
      console.log("final act", kact);
    }
    */
    game.players[0].setActions(kact);
    const eact = ai2.think(game, 1);
    game.players[1].setActions(eact);
    game.nextTurn();
    /*
    if (battleNum == 1) {
      KinoUtil.printBoard(game);
    }
    */
    /*
    if (game.turn === 3) {
      Deno.exit(0);
    }
     */
  }
  const p = game.field.getPoints();
  const ps = [
    p[0].basepoint + p[0].wallpoint,
    p[1].basepoint + p[1].wallpoint
  ];
  if (ps[0] > ps[1]) {
    win[0]++;
  } else {
    win[1]++;
  }
  battlePoint[0] += ps[0];
  battlePoint[1] += ps[1];
}
console.log(win);
console.log(parseInt(win[0] / battleNum * 100), "%");
console.log(parseInt(battlePoint[0] / battleNum), ":", parseInt(battlePoint[1] / battleNum));

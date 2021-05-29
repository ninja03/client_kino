import { KinoAI } from "./KinoAI.js";
import { A4AI } from "./A4AI.js";
import { Board, Game, Player } from "./Kakomimasu.js";
import { KinoUtil } from "./KinoUtil.js";

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

let board = new Board(JSON.parse(Deno.readTextFileSync("board/A-1.json")));

for (let i = 0; i < battleNum; i++) {
  const game = new Game(board);
  game.attachPlayer(new Player(0));
  game.attachPlayer(new Player(1));
  while (!game.ending) {
    let info = KinoUtil.game2Info(game);
    // console.log("game.turn", game.turn)
    const kact = ai1.think(info, 0);
    /*
    if (battleNum == 1) {
      console.log("final act", kact);
    }
    */
    game.players[0].setActions(KinoUtil.convertCoreAction(kact));
    const eact = ai2.think(info, 1);
    game.players[1].setActions(KinoUtil.convertCoreAction(eact));
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

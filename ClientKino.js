import { Action } from "../Kakomimasu.js";
import { KakomimasuClient, Action as ActionC } from "../client_deno/KakomimasuClient.js"
import { KinoAI } from "./KinoAI.js";
import { KinoUtil } from "./KinoUtil.js";

let kc = new KakomimasuClient("kino0828", "kino", "サンプル", "kino0828-pw" );
// kc.setServerHost("http://localhost:8880"); // ローカルに接続してチェックする場合に使う
kc.setServerHost("https://kakomimasu.sabae.club");

let info = await kc.waitMatching();
let pno = kc.getPlayerNumber();

let ai = new KinoAI();

info = await kc.waitStart(); // スタート時間待ち
while (info) {
  let game = KinoUtil.info2Game(info);
  let actions = KinoUtil.convertActionC(ai.think(game, pno, 1000));
  console.log(actions);
  kc.setActions(actions);
  info = await kc.waitNextTurn();
}

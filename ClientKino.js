import { Action } from "./Kakomimasu.js";
import { KakomimasuClient, Action as ActionC } from "./KakomimasuClient.js"
import { KinoAI } from "./KinoAI.js";
import { KinoUtil } from "./KinoUtil.js";

let kc = new KakomimasuClient("kino0828", "kino", "サンプル", "kino0828-pw" );
kc.setServerHost("http://localhost:8880"); // ローカルに接続してチェックする場合に使う
// kc.setServerHost("https://practice.kakomimasu.website/"); 

let info = await kc.waitMatching();
let pno = kc.getPlayerNumber();

let ai = new KinoAI();

info = await kc.waitStart(); // スタート時間待ち
while (info) {
  let actions = ai.think(info, pno, 1000);
  kc.setActions(actions);
  info = await kc.waitNextTurn();
}

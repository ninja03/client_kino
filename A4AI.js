import util from "./util.js";
import {Action} from "./Kakomimasu.js";
import {DIR} from "./KakomimasuClient.js";

class A4AI {
  think(game, pid) {
    // ポイントの高い順ソート
    const pntall = [];
    for (let x = 0; x < game.board.w; x++) {
      for (let y = 0; y < game.board.h; y++) {
        pntall.push({x: x, y: y, point: game.board.points[x + y * game.board.w]});
      }
    }
    const sortByPoint = p => {
      p.sort((a, b) => b.point - a.point);
    };
    sortByPoint(pntall);

    const actions = [];
    const offset = 0;//util.rnd(game.board.nagent);
    const poschk = []; // 動く予定の場所
    const checkFree = (x, y) => {
      for (let i = 0; i < poschk.length; i++) {
        const p = poschk[i];
        if (p.x === x && p.y === y)
          return false;
      }
      return true;
    };
    // エージェントごとに動きを決めていく
    for (let aid = 0; aid < game.board.nagent; aid++) {
      const agent = game.agents[pid][aid];
      // console.log(field);
      if (agent.x === -1) {
        // PUT
        const p = pntall[aid + offset];
        actions.push(new Action(aid, Action.PUT, p.x, p.y));
      } else {
        // 移動、除去
        const dirall = [];
        for (const [dx, dy] of DIR) {
          const x = agent.x + dx;
          const y = agent.y + dy;
          if (x >= 0 && x < game.board.w
            && y >= 0 && y < game.board.w
            && checkFree(x, y)
          ) {
            const f = game.field.field[x + y * game.board.w];
            const point = game.board.points[x + y * game.board.w];
            if (f[0] === 0 && f[1] !== -1 && f[1] !== pid) { // 敵土地、おいしい！
              dirall.push({x, y, type: f[0], pid: f[1], point: point + 10});
            } else if (f[0] === 0 && f[1] === -1) { // 空き土地優先
              dirall.push({x, y, type: f[0], pid: f[1], point: point + 5});
            } else if (f[0] === 1 && f[1] !== pid) { // 敵壁
              dirall.push({x, y, type: f[0], pid: f[1], point: point});
            }
          }
        }
        if (dirall.length > 0) { //  && util.rnd(5) > 0) { // 膠着状態を防ぐために20%で回避 → 弱くなった
          sortByPoint(dirall);
          const p = dirall[0];
          if (p.type === 0 || p.pid === -1) {
            actions.push(new Action(aid, Action.MOVE, p.x, p.y));
            poschk.push({x: p.x, y: p.y});
            poschk.push({x: agent.x, y: agent.y}); // 動けなかった時用
          } else {
            actions.push(new Action(aid, Action.REMOVE, p.x, p.y));
            poschk.push({x: agent.x, y: agent.y});
          }
        } else {
          // 周りが全部埋まっていたらランダムに動く
          for (; ;) {
            const [dx, dy] = DIR[util.rnd(8)];
            const x = agent.x + dx;
            const y = agent.y + dy;
            if (x < 0 || x >= game.board.width
              || y < 0 || y >= game.board.height
            ) {
              continue;
            }
            actions.push(new Action(aid, Action.MOVE, x, y));
            poschk.push({x, y});
            break;
          }
        }
      }
    }
    return actions;
  }
}

export { A4AI };
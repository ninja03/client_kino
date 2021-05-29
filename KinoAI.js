import util from "./util.js";
import { Action, DIR } from "./KakomimasuClient.js";
import { BeamSearch } from "./BeamSearch.js";
import { KinoUtil } from "./KinoUtil.js";

class KinoAI {
  constructor() {
    this.putbson = false;
    this.bson = true;
    this.bs = new BeamSearch();
    this.offseton = false;
  }

  think(info, pid) {
    let game = KinoUtil.info2Game(info);
    // ポイントの高い順ソート
    let pntall;
    if (this.putbson) {
      pntall = this.getPntBs(game, pid);
      // console.log("pntall", pntall);
    } else {
      pntall = this.getPntAll(game, pid);
    }
    const actions = [];
    let offset;
    if (this.offseton) {
      offset = util.rnd(game.board.nagent);
    } else {
      offset = 0;
    }
    const poschk = []; // 動く予定の場所
    const checkFree = (x, y) => {
      for (let i = 0; i < poschk.length; i++) {
        const p = poschk[i];
        if (p.x === x && p.y === y)
          return false;
      }
      return true;
    };
    let beamTarget = [];

    // エージェントごとに動きを決めていく
    for (let aid = 0; aid < game.board.nagent; aid++) {
      const agent = game.agents[pid][aid];
      // console.log(field);
      if (agent.x === -1) {
        // PUT
        const p = pntall[aid + offset];
        actions.push(new Action(aid, "PUT", p.x, p.y));
        poschk.push({x: p.x, y: p.y});
      } else {
        if (this.bson) {
          beamTarget.push(aid);
        } else {
          // 破壊者の移動、除去
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
            this.sortByPoint(dirall);
            const p = dirall[0];
            if (p.type === 0 || p.pid === -1) {
              actions.push(new Action(aid, "MOVE", p.x, p.y));
              poschk.push({x: p.x, y: p.y});
              poschk.push({x: agent.x, y: agent.y}); // 動けなかった時用
            } else {
              actions.push(new Action(aid, "REMOVE", p.x, p.y));
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
              actions.push(new Action(aid, "MOVE", x, y));
              poschk.push({x, y});
              break;
            }
          }
        }
      }
    }
    if (this.bson) {
      // ビームサーチ
      /*
      this.bs.maxDepth = 5;
      this.bs.maxWidth = 30;
       */
      let result = this.bs.agentAct(game, pid, beamTarget, poschk);
      for (let r of result) {
        actions.push(r);
      }
    }
    return actions;
  }

  getPntBs(game, pid) {
    let pntall = [];
    for (let x = 0; x < game.board.w; x++) {
      for (let y = 0; y < game.board.h; y++) {
        // 相手の壁は置けないのでスキップ
        const f = game.field.field[x + y * game.board.w];
        if (f[0] === 1 && f[1] !== pid) {
          continue;
        }
        let startPoint;
        if (f[1] === pid) {
          // 自分の領域
          startPoint = 0;
        } else {
          startPoint = game.board.points[x + y * game.board.w]
        }
        /*
        this.bs.maxDepth = 1;
        this.bs.maxWidth = 30;
        */
        let result = this.bs.search(game, pid, x, y, startPoint);
        // console.log("x:", x, " y:", y, " result", result);
        if (result.length > 0) {
          pntall.push({x: x, y: y, point: result[0].value});
        }
      }
    }
    this.sortByPoint(pntall);
    return pntall;
  }

  getPntAll(game, pid) {
    const pntall = [];
    for (let x = 0; x < game.board.w; x++) {
      for (let y = 0; y < game.board.h; y++) {
        // 相手の壁は置けないのでスキップ
        const f = game.field.field[x + y * game.board.w];
        if (f[0] === 1 && f[1] !== pid) {
          continue;
        }
        // 自分の領域もスキップ
        if (f[1] === pid) {
          continue;
        }
        let mainpoi = game.board.points[x + y * game.board.w];
        if (f[0] === 0 && f[1] !== -1 && f[1] !== pid) { // 敵土地、おいしい！
          mainpoi += 10;
        } else if (f[0] === 0 && f[1] === -1) { // 空き土地優先
          mainpoi += 5;
        } else if (f[0] === 1 && f[1] !== pid) { // 敵壁
          mainpoi += 0;
        }
        // 周囲8マスの一番高いのも含めて
        let mini = null;
        for (const [dx, dy] of DIR) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < game.board.w
            && ny >= 0 && ny < game.board.w) {
            const nf = game.field.field[nx + ny * game.board.w];
            // 自分の領域もスキップ
            if (nf[1] === pid) {
              continue;
            }
            let minipoi = game.board.points[nx + ny * game.board.w];
            if (nf[0] === 0 && nf[1] !== -1 && nf[1] !== pid) { // 敵土地、おいしい！
              minipoi += 10;
            } else if (nf[0] === 0 && nf[1] === -1) { // 空き土地優先
              minipoi += 5;
            } else if (nf[0] === 1 && nf[1] !== pid) { // 敵壁
              minipoi += 0;
            }
            if (mini === null || minipoi > mini) {
              mini = minipoi;
            }
          }
        }
        if (mini === null) {
          mini = 0;
        }
        pntall.push({x: x, y: y, point: mainpoi + mini / 100});
      }
    }
    this.sortByPoint(pntall);
    return pntall;
  }

  sortByPoint(p) {
    p.sort((a, b) => b.point - a.point);
  }

}

export { KinoAI };
import { KinoAI } from "./KinoAI.js"
import { A4AI } from "./A4AI.js"
import { DIR } from "./KakomimasuClient.js";
import { sleep } from "./client_util.js";
import {KinoUtil} from "./KinoUtil.js";
import {Action} from "./Kakomimasu.js";

class BeamSearch {

  constructor() {
    this.maxDepth = 4;
    this.maxWidth = 60;
    this.naname = false;
  }

  debug(a = "") {
    // console.log(a);
  }

  agentAct(game, pid, beamTarget, poschk) {
    let returnVector = [];

    let valueQue = [];
    for (let said of beamTarget) {
      let aid = parseInt(said);
      let result = this.search(game, pid, aid);
      for (let r of result) {
        valueQue.push({
          value: r.value,
          aid: aid,
          x: r.x,
          y: r.y
        });
      }
    }
    valueQue.sort((a, b) => b.value - a.value);
    this.debug("valueQue");
    this.debug(valueQue);
    let usedPoints = new Set();
    let setFlag = Array(game.board.nagent).fill(false);
    for (let p of poschk) {
      usedPoints.add(p.x + "," + p.y);
    }
    for (let i = 0; i < valueQue.length; i++) {
      let a = valueQue[i];
      let agent = game.agents[pid][a.aid];
      let key = a.x + "," + a.y;
      if (usedPoints.has(key) || setFlag[a.aid]) {
        continue;
      }
      if (a.x !== agent.x || a.y !== agent.y) {
        setFlag[a.aid] = true;
      }
      usedPoints.add(key);
      let state = game.field.field[a.x + a.y * game.board.w];
      let type = Action.MOVE;
      if (a.x === agent.x && a.y === agent.y) {
        type = Action.NONE;
      } else if (state[0] === 1 && state[1] !== pid) {
        type = Action.REMOVE;
      }
      returnVector.push(new Action(a.aid, type, a.x, a.y));
    }
    return returnVector;
  }

  search(game, pid, aid) {
    let dx, dy;
    if (this.naname) {
      dx = [-1, 1, 0, 0, -1, 1, -1, 1, 0];
      dy = [0, 0, 1, -1, 1, -1, -1, 1, 0];
    } else {
      dx = [-1, 1, 0, 0, 0];
      dy = [0, 0, 1, -1, 0];
    }
    let maxDepth = Math.min(this.maxDepth, game.nturn - game.turn + 1);
    this.debug("maxDepth " + maxDepth);
    let agent = game.agents[pid][aid];
    let startPoint = {
      value: 0,
      moves: [{
        x: agent.x,
        y: agent.y
      }]
    };

    // 小さい順
    let nowQue = [];
    let nextQue = [];
    nowQue.push(startPoint);

    for (let depth = 0; depth < maxDepth; depth++) {
      this.debug("----------------------");
      this.debug("NEXT depth: " + depth);

      let nextNextQue = [];
      while (nowQue.length !== 0) {
        this.debug();
        this.debug("NEXT TENKAI");
        this.debug("nowQue");
        this.debug(nowQue);
        this.debug("nextQue");
        this.debug(nextQue);
        this.debug("nextNextQue");
        this.debug(nextNextQue);
        let value = nowQue[0].value;
        let moves = nowQue[0].moves.concat();
        value *= 1.4;
        nowQue.shift();
        this.debug("value");
        this.debug(value);
        this.debug("moves");
        this.debug(moves);

        // 行動した回数
        let changePoints = new Set();
        for (let point of moves) {
          changePoints.add(point.x + "," + point.y);
        }
        this.debug("changePoints = " + changePoints);

        let nowPoint = moves[moves.length - 1];
        this.debug("nowPoint" + nowPoint);
        // 展開
        for (let moveIndex = 0; moveIndex < dy.length; moveIndex++) {
          this.debug();
          let movedPoint = {
            x: nowPoint.x + dx[moveIndex],
            y: nowPoint.y + dy[moveIndex]
          };
          if (movedPoint.x < 0 || movedPoint.x >= game.board.w
            || movedPoint.y < 0 || movedPoint.y >= game.board.h) {
            continue;
          }
          // this.debug("移動先 ", movedPoint.x, movedPoint.y);
          // movesに次の座標をつけたのがnewMoves
          let newMoves = moves.concat();
          newMoves.push({
            x: movedPoint.x,
            y: movedPoint.y
          });

          let alreadyMoved = changePoints.has(movedPoint.x + "," + movedPoint.y);
          let state = game.field.field[movedPoint.x + movedPoint.y * game.board.w];
          this.debug("state " + state);
          let statePoint = game.board.points[movedPoint.x + movedPoint.y * game.board.w];
          this.debug("statePoint " + statePoint);

          if (state[1] === -1 && alreadyMoved === false) {
            // 空き場所
            this.debug("空き場所");
            nextQue.push({
              value: value + statePoint,
              moves: newMoves
            });
            nextQue.sort((a, b) => b.value - a.value);
          } else if ((state[1] === -1 && alreadyMoved === true) || state[1] === pid) {
            // すでに移動予定場所の空き場所、か自分のエリアなら0
            this.debug("すでに移動予定場所の空き場所、か自分のエリアなら0");
            nextQue.push({
              value: value,
              moves: newMoves
            });
            nextQue.sort((a, b) => b.value - a.value);
          } else {
            // 相手の土地は次の次のターンで2倍のポイント
            this.debug("相手の土地は次の次のターンで2倍のポイント");
            nextNextQue.push({
              value: value + 2 * statePoint,
              moves: newMoves
            });
            nextNextQue.sort((a, b) => b.value - a.value);
          }
        }
        while (nextQue.length > this.maxWidth) {
          nextQue.pop();
        }
      }
      nowQue = nextQue.concat();
      nextQue = nextNextQue.concat();
      nextNextQue = [];
    }
    this.debug("RESULT");
    this.debug(nowQue.length);

    let result = [];
    let temp = new Set();
    for (let q of nowQue) {
      let x, y;
      if (q.moves.length === 1) {
        x = agent.x;
        y = agent.y;
      } else {
        x = q.moves[1].x;
        y = q.moves[1].y;
      }
      let r = result.find(a => a.x === x && a.y === y);
      if (r === undefined) {
        r = {x: x, y: y, value: 0};
        result.push(r);
      }
      this.debug("q ", q, " r ", r);
      r.value += q.value;
    }
    for (let r of result) {
      r.value *= Math.pow(1.3, r.value);
    }
    result.sort((a, b) => b.value - a.value);
    return result;
  }

  test() {
    let info = KinoUtil.load("./board/10x10_2.log", 0);
    let game = KinoUtil.info2Game(info);
// console.log(game);
// new KinoAI().think(game, 0)
    KinoUtil.printBoard(game);

    let bs = new BeamSearch();
    console.log("agentAct = ", bs.agentAct(game, 0));
// bs.search(game, 0, 0);
  }
}

export { BeamSearch }

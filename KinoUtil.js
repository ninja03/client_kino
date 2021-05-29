import { Game, Action as CoreAction, Board, Field, Kakomimasu} from "./Kakomimasu.js";
import {Action as ActionC, KakomimasuClient} from "./KakomimasuClient.js";

class KinoUtil {

  static convertActionC(actions) {
    let actionsc = [];
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      let type;
      switch (a.type) {
        case Action.PUT:    type = "PUT";    break;
        case Action.NONE:   type = "NONE";   break;
        case Action.MOVE:   type = "MOVE";   break;
        case Action.REMOVE: type = "REMOVE"; break;
      }
      actionsc.push(new ActionC(a.agentid, type, a.x, a.y));
    }
    return actionsc;
  }
  
  static convertCoreAction(actions) {
    let coreActions = [];
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      let type;
      switch (a.type) {
        case "PUT":    type = CoreAction.PUT;    break;
        case "NONE":   type = CoreAction.NONE;   break;
        case "MOVE":   type = CoreAction.MOVE;   break;
        case "REMOVE": type = CoreAction.REMOVE; break;
      }
      coreActions.push(new CoreAction(a.agentId, type, a.x, a.y));
    }
    return coreActions;
  }

  static printArray(array) {
    let buf = "";
    for (let y = 0; y < array[0].length; y++) {
      for (let x = 0; x < array.length; x++) {
        if (array[x][y] < 10) {
          buf += " ";
        }
        buf += array[x][y] + " ";
      }
      buf += "\n";
    }
    console.log(buf);
  }

  static info2Game(info) {
    const kkmm = new Kakomimasu();

    let board = new Board(
      info.board.width,
      info.board.height,
      info.board.points,
      info.board.nAgent,
      info.board.nTurn,
      info.board.nSec,
      info.board.nPlayer
    );
    board.name = info.board.name;

    const game = new Game(board);
    game.uuid = info.gameId;
    game.startedAtUnixTime = info.startedAtUnixTime;
    game.nextTurnUnixTime = info.nextTurnUnixTime;
    game.turn = info.turn;
    
    for (let i = 0; i < game.board.w * game.board.h; i++) {
      let type;
      const t = info.tiled[i][0];
      if (t === 0) {
        type = Field.BASE;
      } else if (t === 1) {
        type = Field.WALL;
      }
      game.field.field[i] = [type, info.tiled[i][1]];
    }
    for (let pid = 0; pid < game.board.nplayer; pid++) {
      for (let aid = 0; aid < game.board.nagent; aid++) {
        game.agents[pid][aid].x = info.players[pid].agents[aid].x;
        game.agents[pid][aid].bkx = info.players[pid].agents[aid].x;
        game.agents[pid][aid].y = info.players[pid].agents[aid].y;
        game.agents[pid][aid].bky = info.players[pid].agents[aid].y;
      }
      const p = kkmm.createPlayer("test" + pid);
      p.index = pid;
      p.setGame(game);
      game.players.push(p);
    }
    return game;
  }

  static game2Info(game) {
    return JSON.parse(JSON.stringify(game))
  }

  static printBoard(game) {
    let tmp = Array(game.board.w);
    for (let x = 0; x < game.board.w; x++) {
      tmp[x] = Array(game.board.h);
      for (let y = 0; y < game.board.h; y++) {
        tmp[x][y] = Array(2);
        tmp[x][y][0] = "";
        // 誰かの領地
        if (game.field.field[x + y * game.board.w][1] !== -1) {
          // 壁か領域
          if (game.field.field[x + y * game.board.w][0] === 0) {
            if (game.field.field[x + y * game.board.w][1] === 0) {
              tmp[x][y][0] = "o";
            } else {
              tmp[x][y][0] = "x";
            }
          } else {
            if (game.field.field[x + y * game.board.w][1] === 0) {
              tmp[x][y][0] = "O";
            } else {
              tmp[x][y][0] = "X";
            }
          }
        }
        tmp[x][y][1] = game.board.points[x + y * game.board.w] + "";
      }
    }
    for (let pid = 0; pid < game.board.nplayer; pid++) {
      for (let aid = 0; aid < game.board.nagent; aid++) {
        const ag = game.agents[pid][aid];
        if (ag.x !== -1) {
          if (game.field.field[ag.x + ag.y * game.board.w][1] === 0) {
            tmp[ag.x][ag.y][0] += "(" + aid + ")";
          } else {
            tmp[ag.x][ag.y][0] += "<" + aid + ">";
          }
        }
      }
    }
    let buf = "";
    for (let i = 0; i < game.board.w * 4; i++) {
      buf += "-";
    }
    buf += "\n";
    const p = game.field.getPoints();
    buf += game.turn + "/" + game.nturn + " ";
    buf += (p[0].basepoint + p[0].wallpoint);
    buf += ":";
    buf += (p[1].basepoint + p[1].wallpoint);
    buf += "\n\n";
    for (let y = 0; y < tmp.length; y++) {
      for (let c = 0; c < 2; c++) {
        for (let x = 0; x < tmp[y].length; x++) {
          buf += tmp[x][y][c];
          for (let i = 0; i < 4 - tmp[x][y][c].length; i++) {
            buf += " ";
          }
        }
        buf += "\n";
        /*
        if (c == 1) {
          buf += "\n";
        }
        */
      }
    }
    for (let i = 0; i < game.board.w * 4; i++) {
      buf += "-";
    }
    console.log(buf);
  }

  static buildActions(game, pid, aid) {
    let w = game.board.w;
    let h = game.board.h;
    let field = game.field.field;
    let agent = game.agents[pid][aid];
    let list = [];
    // PASS
    if (agent.x == -1) {
      // 置かない
      list.push(null);
      // 設置
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const f = field[x + y * w];
          // 相手城壁設置不可
          if (f[0] === 1 && f[1] !== pid) {
            continue;
          }
          list.push(new Action(aid, Action.PUT, x, y));
        }
      }
    } else {
      // パス
      list.push(new Action(aid, Action.NONE, agent.x, agent.y));
      // 移動除去
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          const x = agent.x + dx;
          const y = agent.y + dy;
          if (x < 0 || x >= w || y < 0 || y >= h) {
            continue;
          }
          const f = field[x + y * w];
          // 相手城壁以外への移動
          if (!(f[0] === 1 && f[1] !== pid)) {
            list.push(new Action(aid, Action.MOVE, x, y));
          }
          // 城壁なら除去できる
          if (f[0] === 1) {
            list.push(new Action(aid, Action.REMOVE, x, y))
          }
        }
      }
    }
    return list;
  }
  static load(logname, n) {
    return JSON.parse(Deno.readTextFileSync(logname))[n];
  }
}
export { KinoUtil };

/*
Object.assign(globalThis, util);
const p = console.log;
console.log(rnd(10));
Deno.exit(0);
*/

/*
const array = [
  [1, 2, 3],
  [3, 40, 5],
  [6, 7, 8]
];
printArray(array);
Deno.exit(0);
*/
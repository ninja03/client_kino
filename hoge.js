import {Action, Board, Field, Kakomimasu} from "../Kakomimasu.js";

function test() {
  const logname = "10x10.log";
  // const logname = "test.log";
  const info = JSON.parse(Deno.readTextFileSync(logname))[5];
  console.log(printBoard(info2Game(info)));
  const start = new Date().getTime();
  think(info, 0);
  console.log(new Date().getTime() - start);
}

function think(info, pno, maxTime) {
  const startTime = new Date().getTime();
  const masterGame = info2Game(info);

  const actions = [];
  for (let aid = 0; aid < masterGame.board.nagent; aid++) {
    actions.push(buildActions(masterGame, pno, aid));
  }
  console.log("すべての手\n", actions, "\n");

  let pat = new Array(masterGame.board.nagent);
  for (let aid = 0; aid < masterGame.board.nagent; aid++) {
    pat[aid] = 0;
  }

  // pat = [  3, 1, 1, 6, 0, 0, 0, 0];

  let count = 0;
  let maxCount = 1;
  for (let aid = 0; aid < actions.length; aid++) {
    maxCount *= actions[aid].length;
  }

  let maxPoint = Number.MIN_VALUE;
  let maxAct;
  while (true) {
    count++;
    if (count % 10000 == 0) {
      console.log(count + "/" + maxCount);
    }
    // 組み合わせ
    const act = [];
    for (let aid = 0; aid < masterGame.board.nagent; aid++) {
      if (actions[aid][pat[aid]] !== null) {
        const a = actions[aid][pat[aid]];
        if (a === null) {
          act.push(null);
        } else {
          act.push(new Action(a.agentid, a.type, a.x, a.y));
        }
      }
    }
    // 自分で競合するのは使わない
    let ignore = false;
    const set = new Set();
    for (const a of act) {
      if (a === null) {
        continue;
      }
      const s = a.x + "," + a.y;
      if (set.has(s)) {
        ignore = true;
        break;
      }
      set.add(a.x + "," + a.y);
    }

    // 実際に動かして点数を
    if (!ignore) {
      const game = info2Game(info);
      game.players[pno].setActions(act);
      game.players[pno === 0 ? 1 : 0].setActions([]);
      game.nextTurn();
      const p = game.field.getPoints();
      const psum = p[pno].basepoint + p[pno].wallpoint;

      if (psum > maxPoint) {
        maxAct = act;
        maxPoint = psum;
        console.log(printBoard(game), "\n", maxAct, "\n = ", maxPoint);
      }
      // console.log(printBoard(game));
      // console.log(pat, act, " = ", psum);
    }
    // 次の手
    let aid;
    for (aid = 0; aid < masterGame.board.nagent; aid++) {
      pat[aid]++;
      if (pat[aid] < actions[aid].length) {
        break;
      }
      pat[aid] = 0;
    }
    if (aid === masterGame.board.nagent) {
      break;
    }
    if (new Date().getTime() - startTime > maxTime) {
      return maxAct;
    }
  }
  return maxAct;
}

function printBoard(game) {
  let tmp = new Array(game.board.w);
  for (let x = 0; x < game.board.w; x++) {
    tmp[x] = new Array(game.board.h);
    for (let y = 0; y < game.board.h; y++) {
      tmp[x][y] = new Array(2);
      tmp[x][y][0] = "";
      // 誰かの領地
      if (game.field.field[x + y * game.board.w][1] !== -1) {
        // 壁か領域
        if (game.field.field[x + y * game.board.w][0] === 0) {
          if (game.field.field[x + y * game.board.w][1] === 0) {
            tmp[x][y][0] = "●";
          } else {
            tmp[x][y][0] = "○";
          }
        } else {
          if (game.field.field[x + y * game.board.w][1] === 0) {
            tmp[x][y][0] = "■";
          } else {
            tmp[x][y][0] = "□";
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
          tmp[ag.x][ag.y][0] += "★" + aid;
        } else {
          tmp[ag.x][ag.y][0] += "☆" + aid;
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
  buf += game.turn + "/" + game.nturn + "\n";
  buf += (p[0].basepoint + p[0].wallpoint);
  buf += ":";
  buf += (p[1].basepoint + p[1].wallpoint);
  buf += "\n";
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
  return buf;
}

function buildActions(game, pid, aid) {
  const w = game.board.h;
  const h = game.board.h;
  const field = game.field.field;
  const agent = game.agents[pid][aid];
  const list = [];
  // PASS
  if (agent.x === -1) {
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

function info2Game(gameInfo) {
  const kkmm = new Kakomimasu();
  const game = kkmm.createGame(
    new Board(
      gameInfo.board.width,
      gameInfo.board.height,
      gameInfo.board.points,
      gameInfo.board.nAgent
    ),
    gameInfo.totalTurn
  );
  game.uuid = gameInfo.gameId;
  game.startedAtUnixTime = gameInfo.startedAtUnixTime;
  game.nextTurnUnixTime= gameInfo.nextTurnUnixTime;
  game.turn = gameInfo.turn;
  for (let i = 0; i < game.board.w * game.board.h; i++) {
    let type;
    const t = gameInfo.tiled[i][0];
    if (t === 0) {
      type = Field.BASE;
    } else if (t === 1) {
      type = Field.WALL;
    }
    game.field.field[i] = [type, gameInfo.tiled[i][1]];
  }
  for (let pid = 0; pid < game.board.nplayer; pid++) {
    for (let aid = 0; aid < game.board.nagent; aid++) {
      game.agents[pid][aid].x = gameInfo.players[pid].agents[aid].x;
      game.agents[pid][aid].bkx = gameInfo.players[pid].agents[aid].x;
      game.agents[pid][aid].y = gameInfo.players[pid].agents[aid].y;
      game.agents[pid][aid].bky = gameInfo.players[pid].agents[aid].y;
    }
    const p = kkmm.createPlayer("test" + pid);
    p.index = pid;
    p.setGame(game);
    game.players.push(p);
  }
  return game;
}
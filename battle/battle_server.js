// import {routes} from "./apiserver.ts";

function startBrowser() {
  const getChromePath = () => {
    return "c:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
  };
  Deno.run({
    cmd: [getChromePath(), "http://localhost:8880/game"],
    stdout: "piped", stderr: "piped"
  });
}

function startServer() {
  const p1 = Deno.run({
    cmd: ["deno", "run", "-A", "../apiserver/apiserver.ts"],
    cwd: "../apiserver/",
    stdout: "piped", stderr: "piped"
  });
  console.log("server")
  p1.status();
}

async function startClient() {
  const p1 = Deno.run({
    cmd: ["deno", "run", "-A", "../client_deno/client_a3.js"],
    cwd: "../client_deno/",
    stdout: "piped", stderr: "piped"
  });
  console.log("status1")
  p1.status();
  /*
  const p2 = Deno.run({
    cmd: ["deno", "run", "-A", "../client_deno/client_a4.js"],
    cwd: "../client_deno/",
    stdout: "piped", stderr: "piped"
  });
  console.log("status2")
  p2.status();
   */
}

// startServer();
startClient();

/*
const rawOutput1 = await p1.output();
console.log(new TextDecoder().decode(rawOutput1));

const rawOutput2 = await p2.output();
console.log(new TextDecoder().decode(rawOutput2));
*/

/*
function sleep(msec) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), msec);
  });
}
while (true) {
  await sleep(1000);
}
*/
const net = require("net");

function getRedisUrl() {
  if (!process.env.REDIS_URL) {
    const error = new Error("REDIS_URL is required to connect to Redis");
    error.code = "REDIS_URL_MISSING";
    throw error;
  }
  return process.env.REDIS_URL;
}

function parseRedisUrl() {
  const url = new URL(getRedisUrl());
  return { host: url.hostname, port: Number(url.port || 6379), password: decodeURIComponent(url.password || ""), db: url.pathname ? Number(url.pathname.slice(1) || 0) : 0 };
}

function encodeCommand(parts) {
  return `*${parts.length}\r\n${parts.map((part) => `$${Buffer.byteLength(String(part))}\r\n${part}\r\n`).join("")}`;
}

async function redisCommand(parts, { timeoutMs = Number(process.env.REDIS_HEALTH_TIMEOUT_MS || 3000) } = {}) {
  const config = parseRedisUrl();
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: config.host, port: config.port });
    const timer = setTimeout(() => finish(new Error(`Redis command timed out after ${timeoutMs}ms`)), timeoutMs);
    let buffer = "";
    let authed = !config.password;
    let selected = config.db === 0;
    const finish = (err, value) => { clearTimeout(timer); socket.destroy(); err ? reject(err) : resolve(value); };
    const sendNext = () => {
      if (!authed) return socket.write(encodeCommand(["AUTH", config.password]));
      if (!selected) return socket.write(encodeCommand(["SELECT", config.db]));
      return socket.write(encodeCommand(parts));
    };
    socket.on("connect", sendNext);
    socket.on("error", finish);
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (!buffer.includes("\r\n")) return;
      const line = buffer.split("\r\n")[0];
      buffer = "";
      if (line.startsWith("-")) return finish(new Error(line.slice(1)));
      if (!authed) { authed = true; return sendNext(); }
      if (!selected) { selected = true; return sendNext(); }
      resolve(line.startsWith("+") ? line.slice(1) : line);
      clearTimeout(timer); socket.end();
    });
  });
}

module.exports = { getRedisUrl, parseRedisUrl, redisCommand };

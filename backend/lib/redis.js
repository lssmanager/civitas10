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

class IncompleteRedisResponseError extends Error {
  constructor() {
    super("Incomplete Redis response");
    this.name = "IncompleteRedisResponseError";
  }
}

function readLine(buffer, start) {
  const end = buffer.indexOf("\r\n", start);
  if (end === -1) throw new IncompleteRedisResponseError();
  return { line: buffer.slice(start, end), next: end + 2 };
}

function parseRedisReply(buffer, start = 0) {
  if (start >= buffer.length) throw new IncompleteRedisResponseError();
  const type = buffer[start];
  const { line, next } = readLine(buffer, start);

  if (type === "+") return { value: line.slice(1), next };
  if (type === "-") throw new Error(line.slice(1));
  if (type === ":") return { value: Number(line.slice(1)), next };
  if (type === "$") {
    const length = Number(line.slice(1));
    if (length === -1) return { value: null, next };
    const end = next + length;
    if (buffer.length < end + 2) throw new IncompleteRedisResponseError();
    return { value: buffer.slice(next, end), next: end + 2 };
  }
  if (type === "*") {
    const count = Number(line.slice(1));
    if (count === -1) return { value: null, next };
    const items = [];
    let cursor = next;
    for (let index = 0; index < count; index += 1) {
      const parsed = parseRedisReply(buffer, cursor);
      items.push(parsed.value);
      cursor = parsed.next;
    }
    return { value: items, next: cursor };
  }
  return { value: line, next };
}

async function redisCommand(parts, { timeoutMs = Number(process.env.REDIS_HEALTH_TIMEOUT_MS || 3000) } = {}) {
  const config = parseRedisUrl();
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: config.host, port: config.port });
    const timer = setTimeout(() => finish(new Error(`Redis command timed out after ${timeoutMs}ms`)), timeoutMs);
    let buffer = "";
    let authed = !config.password;
    let selected = config.db === 0;
    let settled = false;

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (err) reject(err);
      else resolve(value);
    };

    const sendNext = () => {
      if (!authed) return socket.write(encodeCommand(["AUTH", config.password]));
      if (!selected) return socket.write(encodeCommand(["SELECT", config.db]));
      return socket.write(encodeCommand(parts));
    };

    socket.on("connect", sendNext);
    socket.on("error", (error) => finish(error));
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      try {
        const parsed = parseRedisReply(buffer);
        if (!authed) {
          authed = true;
          buffer = "";
          return sendNext();
        }
        if (!selected) {
          selected = true;
          buffer = "";
          return sendNext();
        }
        return finish(null, parsed.value);
      } catch (error) {
        if (error instanceof IncompleteRedisResponseError) return;
        return finish(error);
      }
    });
  });
}

module.exports = { getRedisUrl, parseRedisUrl, redisCommand };
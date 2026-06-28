const net = require("net");
const tls = require("tls");
const crypto = require("crypto");

const DEFAULT_TIMEOUT_MS = Number(process.env.DATABASE_HEALTH_TIMEOUT_MS || 5000);
let cachedConfig;

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL is required to connect to Postgres");
    error.code = "DATABASE_URL_MISSING";
    throw error;
  }
  return process.env.DATABASE_URL;
}

function parseDatabaseUrl() {
  if (cachedConfig?.source === process.env.DATABASE_URL) return cachedConfig;
  const url = new URL(getDatabaseUrl());
  cachedConfig = {
    source: process.env.DATABASE_URL,
    host: url.hostname,
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    ssl: ["1", "true", "require"].includes((url.searchParams.get("sslmode") || process.env.DATABASE_SSL || "").toLowerCase()),
  };
  return cachedConfig;
}

function writeCString(value) {
  return Buffer.from(`${value}\0`);
}

function buildStartupMessage(config) {
  const pairs = ["user", config.user, "database", config.database, "application_name", "civitas-api", "client_encoding", "UTF8"];
  const body = Buffer.concat([Buffer.from([0, 3, 0, 0]), ...pairs.flatMap((item) => [writeCString(item)]), Buffer.from([0])]);
  const length = Buffer.alloc(4);
  length.writeInt32BE(body.length + 4);
  return Buffer.concat([length, body]);
}

function md5Password(password, user, salt) {
  const inner = crypto.createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${crypto.createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function sendPassword(socket, password) {
  const value = writeCString(password);
  const length = Buffer.alloc(4);
  length.writeInt32BE(value.length + 4);
  socket.write(Buffer.concat([Buffer.from("p"), length, value]));
}

function sendQuery(socket, sql) {
  const value = writeCString(sql);
  const length = Buffer.alloc(4);
  length.writeInt32BE(value.length + 4);
  socket.write(Buffer.concat([Buffer.from("Q"), length, value]));
}

async function createSocket(config, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: config.host, port: config.port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Postgres connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    socket.once("error", reject);
    socket.once("connect", () => {
      clearTimeout(timer);
      socket.removeListener("error", reject);
      resolve(socket);
    });
  });
}

async function connectPostgres({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const config = parseDatabaseUrl();
  let socket = await createSocket(config, timeoutMs);
  if (config.ssl) {
    socket.write(Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]));
    const response = await new Promise((resolve, reject) => {
      socket.once("data", resolve);
      socket.once("error", reject);
    });
    if (response.toString() !== "S") throw new Error("Postgres server does not accept SSL");
    socket = tls.connect({ socket, servername: config.host });
  }
  socket.write(buildStartupMessage(config));
  return { socket, config };
}

async function queryPostgres(sql = "select 1", options = {}) {
  const { socket, config } = await connectPostgres(options);
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    let done = false;
    let buffer = Buffer.alloc(0);
    const timer = setTimeout(() => finish(new Error(`Postgres query timed out after ${timeoutMs}ms`)), timeoutMs);
    const finish = (err, result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.destroy();
      err ? reject(err) : resolve(result);
    };
    socket.on("error", finish);
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 5) {
        const type = String.fromCharCode(buffer[0]);
        const len = buffer.readInt32BE(1);
        if (buffer.length < len + 1) return;
        const body = buffer.subarray(5, len + 1);
        buffer = buffer.subarray(len + 1);
        if (type === "R") {
          const auth = body.readInt32BE(0);
          if (auth === 0) continue;
          if (auth === 3) sendPassword(socket, config.password);
          else if (auth === 5) sendPassword(socket, md5Password(config.password, config.user, body.subarray(4, 8)));
          else finish(new Error(`Unsupported Postgres authentication method ${auth}`));
        } else if (type === "Z") {
          sendQuery(socket, sql);
        } else if (type === "C") {
          finish(null, { ok: true, command: body.toString("utf8").replace(/\0$/, "") });
        } else if (type === "E") {
          finish(new Error(body.toString("utf8").replace(/\0/g, " ").trim() || "Postgres error"));
        }
      }
    });
  });
}

module.exports = { connectPostgres, getDatabaseUrl, parseDatabaseUrl, queryPostgres };

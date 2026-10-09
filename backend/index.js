require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const { promisify } = require("util");

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");
const scrypt = promisify(crypto.scrypt);

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

const app = express();
const authHandoffs = new Map();

app.use(cors());
app.use(bodyParser.json());

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const createToken = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode({ sub: user.id, username: user.username, iat: now, exp: now + 60 * 60 });
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${payload}`;
  const signature = crypto.createHmac("sha256", process.env.JWT_SECRET).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
};

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
};

const verifyPassword = async (password, stored) => {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature || token.split(".").length !== 3) throw new Error("Malformed token");
    const signingInput = `${header}.${payload}`;
    const expected = crypto.createHmac("sha256", process.env.JWT_SECRET).update(signingInput).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) throw new Error("Invalid signature");
    const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decodedHeader.alg !== "HS256" || !decodedPayload.sub || decodedPayload.exp <= Date.now() / 1000) throw new Error("Invalid token");
    req.auth = decodedPayload;
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!username || !email || password.length < 8) {
      return res.status(400).json({ message: "Username and email are required; password must be at least 8 characters" });
    }
    const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(409).json({ message: "Username or email is already registered" });
    const user = await UserModel.create({ username, email, password: await hashPassword(password) });
    return res.status(201).json({ token: createToken(user), user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Username or email is already registered" });
    return res.status(500).json({ message: "Unable to create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const identifier = String(req.body.identifier || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await UserModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid username/email or password" });
    }
    return res.json({ token: createToken(user), user: { id: user.id, username: user.username, email: user.email } });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to sign in" });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const user = await UserModel.findById(req.auth.sub).select("username email");
  if (!user) return res.status(401).json({ message: "Account no longer exists" });
  return res.json({ id: user.id, username: user.username, email: user.email });
});

app.post("/api/auth/handoff", authenticateToken, async (req, res) => {
  const code = crypto.randomBytes(32).toString("base64url");
  authHandoffs.set(code, { userId: req.auth.sub, expiresAt: Date.now() + 60_000 });
  return res.json({ code });
});

app.post("/api/auth/handoff/exchange", async (req, res) => {
  const code = String(req.body.code || "");
  const handoff = authHandoffs.get(code);
  authHandoffs.delete(code);
  if (!handoff || handoff.expiresAt < Date.now()) {
    return res.status(401).json({ message: "Sign-in handoff expired. Please sign in again." });
  }
  const user = await UserModel.findById(handoff.userId);
  if (!user) return res.status(401).json({ message: "Account no longer exists" });
  return res.json({ token: createToken(user) });
});

// app.get("/addHoldings", async (req, res) => {
//   let tempHoldings = [
//     {
//       name: "BHARTIARTL",
//       qty: 2,
//       avg: 538.05,
//       price: 541.15,
//       net: "+0.58%",
//       day: "+2.99%",
//     },
//     {
//       name: "HDFCBANK",
//       qty: 2,
//       avg: 1383.4,
//       price: 1522.35,
//       net: "+10.04%",
//       day: "+0.11%",
//     },
//     {
//       name: "HINDUNILVR",
//       qty: 1,
//       avg: 2335.85,
//       price: 2417.4,
//       net: "+3.49%",
//       day: "+0.21%",
//     },
//     {
//       name: "INFY",
//       qty: 1,
//       avg: 1350.5,
//       price: 1555.45,
//       net: "+15.18%",
//       day: "-1.60%",
//       isLoss: true,
//     },
//     {
//       name: "ITC",
//       qty: 5,
//       avg: 202.0,
//       price: 207.9,
//       net: "+2.92%",
//       day: "+0.80%",
//     },
//     {
//       name: "KPITTECH",
//       qty: 5,
//       avg: 250.3,
//       price: 266.45,
//       net: "+6.45%",
//       day: "+3.54%",
//     },
//     {
//       name: "M&M",
//       qty: 2,
//       avg: 809.9,
//       price: 779.8,
//       net: "-3.72%",
//       day: "-0.01%",
//       isLoss: true,
//     },
//     {
//       name: "RELIANCE",
//       qty: 1,
//       avg: 2193.7,
//       price: 2112.4,
//       net: "-3.71%",
//       day: "+1.44%",
//     },
//     {
//       name: "SBIN",
//       qty: 4,
//       avg: 324.35,
//       price: 430.2,
//       net: "+32.63%",
//       day: "-0.34%",
//       isLoss: true,
//     },
//     {
//       name: "SGBMAY29",
//       qty: 2,
//       avg: 4727.0,
//       price: 4719.0,
//       net: "-0.17%",
//       day: "+0.15%",
//     },
//     {
//       name: "TATAPOWER",
//       qty: 5,
//       avg: 104.2,
//       price: 124.15,
//       net: "+19.15%",
//       day: "-0.24%",
//       isLoss: true,
//     },
//     {
//       name: "TCS",
//       qty: 1,
//       avg: 3041.7,
//       price: 3194.8,
//       net: "+5.03%",
//       day: "-0.25%",
//       isLoss: true,
//     },
//     {
//       name: "WIPRO",
//       qty: 4,
//       avg: 489.3,
//       price: 577.75,
//       net: "+18.08%",
//       day: "+0.32%",
//     },
//   ];

//   tempHoldings.forEach((item) => {
//     let newHolding = new HoldingsModel({
//       name: item.name,
//       qty: item.qty,
//       avg: item.avg,
//       price: item.price,
//       net: item.price,
//       day: item.day,
//     });

//     newHolding.save();
//   });
//   res.send("Done!");
// });

// app.get("/addPositions", async (req, res) => {
//   let tempPositions = [
//     {
//       product: "CNC",
//       name: "EVEREADY",
//       qty: 2,
//       avg: 316.27,
//       price: 312.35,
//       net: "+0.58%",
//       day: "-1.24%",
//       isLoss: true,
//     },
//     {
//       product: "CNC",
//       name: "JUBLFOOD",
//       qty: 1,
//       avg: 3124.75,
//       price: 3082.65,
//       net: "+10.04%",
//       day: "-1.35%",
//       isLoss: true,
//     },
//   ];
//   tempPositions.forEach((item) => {
//     let newPosition = new PositionsModel({
//       product: item.product,
//       name: item.name,
//       qty: item.qty,
//       avg: item.avg,
//       price: item.price,
//       net: item.net,
//       day: item.day,
//       isLoss: item.isLoss,
//     });

//     newPosition.save();
//   });
//   res.send("Done!");
// });

app.get("/allHoldings", authenticateToken, async (req, res) => {
  let allHoldings = await HoldingsModel.find({ userId: req.auth.sub });
  res.json(allHoldings);
});
app.get("/allPositions", authenticateToken, async (req, res) => {
  let allPositions = await PositionsModel.find({ userId: req.auth.sub });
  res.json(allPositions);
});

app.post("/newOrder", authenticateToken, async (req, res) => {
  let newOrder = new OrdersModel({
    name: req.body.name,
    qty: req.body.qty,
    price: req.body.price,
    mode: req.body.mode,
    userId: req.auth.sub,
  });
  await newOrder.save();
  res.status(201).send("Order Saved!");
});

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set in backend/.env");

mongoose.connect(uri).then(() => {
  app.listen(PORT, () => console.log(`App started on port ${PORT}`));
}).catch((error) => {
  console.error("Database connection failed", error);
  process.exit(1);
});

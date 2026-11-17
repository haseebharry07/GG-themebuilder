require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const themeRoutes = require("./routes/themeRoutes");
const routeauth = require("./routes/routeauth");
const adminRoutes = require("./routes/adminRoutes");
const connectDB = require("./lib/mongo");
const session = require("express-session");
const MongoSessionStore = require("./lib/mongoSessionStore");
const webRoutes = require("./routes/webRoutes");
const authRoutes = require("./routes/authRoutes");



const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allowed domains
const allowedOrigins = [
  "https://app.glitchgone.com",
  "https://client1.com",
  "https://client2.com"
];

// ✅ Middleware
app.use(cors({
  origin: "*", // 👈 Temporarily allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form data

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && !sessionSecret) {
  throw new Error("Set SESSION_SECRET (or JWT_SECRET) before starting in production.");
}
app.use(session({
  name: "themebuilder.sid",
  secret: sessionSecret || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  store: new MongoSessionStore(),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
// ✅ Connect DB
connectDB();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// ✅ API Routes FIRST (keep these before static middleware)
app.use("/api/theme", themeRoutes);
app.use("/api/auth", routeauth);
app.use("/admin", adminRoutes);
app.use("/", webRoutes);
app.use("/", authRoutes);



// ✅ Special route (optional)
app.get("/connected", (req, res) => {
  res.send("✅ Your GHL App is connected successfully!");
});

// ✅ Serve static files (AFTER APIs)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Root route — serve index.html
app.get("/", (req, res) => {
  res.redirect("/login");
});

// ✅ CORS / General error handler
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Forbidden: Origin not allowed" });
  }
  next(err);
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

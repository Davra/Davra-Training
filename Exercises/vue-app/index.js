import express from "express";
import session from "express-session";
import passport from "passport";
import axios from "axios";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import bodyParser from "body-parser";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const BASE_URL = process.env.VITE_API_HOST;
const MICROSERVICE_URL = process.env.MICROSERVICE_URL;

let adminToken;
let callbackURL;

try {
  adminToken = fs.readFileSync('/etc/connecthing-api/token', 'utf8');
  callbackURL = `${MICROSERVICE_URL}/callback`;
} catch (err) {
  adminToken = process.env.VITE_BEARER_TOKEN;
  callbackURL = "http://localhost:8080/callback";
}

const app = express();
var sess = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {},
};

app.use(bodyParser.json());
app.use(session(sess));
var pp = passport.initialize();
app.use(pp);
var ppSession = passport.session();
app.use(ppSession);
passport.serializeUser(function (user, cb) {
  cb(null, JSON.stringify(user));
});
passport.deserializeUser(function (userSz, cb) {
  try {
    var userObj = JSON.parse(userSz);
    cb(null, userObj);
  } catch (err) {
    cb(err);
  }
});

let config = {};
console.log("🚀 ~ BASE_URL:", BASE_URL);

config = {
  authorizationURL: BASE_URL + "/oauth/authorize",
  tokenURL: BASE_URL + "/oauth/token",
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL,
  passReqToCallback: true,
};
passport.use(
  new OAuth2Strategy(config, function (req, accessToken, refreshToken, profile, cb) {
    console.log("Successfully authorized: %s", accessToken);
    if (req.session) {
      req.session.oauth = { accessToken: accessToken, refreshToken: refreshToken };
    }

    cb(null, { id: profile.id, accessToken });
  })
);

const path = "dist";

let staticApp = express.static(path);

app.get(
  "/",
  (req, res, next) => {
    if (!req.user) {
      res.redirect("/login");
      return;
    }
    next();
  },
  staticApp
);

app.use(staticApp);

app.get("/login", passport.authenticate("oauth2"), (req, res) => {
  res.redirect("/");
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.send({ loginRedirect: process.env.MICROSERVICE_URL || "/" });
  });
});

app.get("/callback", passport.authenticate("oauth2", { failureRedirect: "/login" }), function (req, res) {
  // Successful authentication, redirect home.
  console.log("Callback...got token from Davra Platform");
  res.redirect("/");
});

app.use(
  "/api",
  createProxyMiddleware({
    target: BASE_URL + "/api",
    changeOrigin: true,
    debug: true,
    on: {
      proxyRes: function (proxyRes, req, res) { },
      proxyReq: function (proxyReq, req, res) {
        proxyReq.removeHeader("cookie");
        proxyReq.setHeader("Authorization", "Bearer " + req.user?.accessToken || "");
        fixRequestBody(proxyReq, req);
      },
      error: function (err, req, res) {
        console.error("error while forwarding a request to middleware: " + err);
      },
    },
  })
);

app.use(
  "/user",
  createProxyMiddleware({
    target: BASE_URL + "/user",
    changeOrigin: true,
    debug: true,
    on: {
      proxyRes: function (proxyRes, req, res) { },
      proxyReq: function (proxyReq, req, res) {
        proxyReq.removeHeader("cookie");
        proxyReq.setHeader("Authorization", "Bearer " + req.user?.accessToken || "");
      },
      error: function (err, req, res) {
        console.error("error while forwarding a request to middleware: " + err);
      },
    },
  })
);

app.listen(8080, () => {
  console.log("Listening on port 8080");
});

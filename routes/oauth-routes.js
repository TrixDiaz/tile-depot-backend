import {Router} from "express";
import {
  oauthGoogle,
  oauthGithub,
  oauthGoogleCallback,
  oauthGithubCallback,
} from "../controllers/oauth-controller.js";

const oauthRouter = Router();

// OAuth initiation routes
oauthRouter.get("/github", oauthGithub);
oauthRouter.get("/google", oauthGoogle);

// OAuth callback routes
oauthRouter.get("/github/callback", oauthGithubCallback);
oauthRouter.get("/google/callback", oauthGoogleCallback);

export {oauthRouter};

import express from "express";
import {submitContactForm} from "../controllers/contact-controller.js";

const contactRouter = express.Router();

contactRouter.post("/", submitContactForm);

export {contactRouter};


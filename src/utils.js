import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "./config/config.js";
import passport from "passport";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

export const createHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

export const isValidPass = (user, password) => {
  return bcrypt.compareSync(password, user.password);
};

export const generateToken = (user) => {
  return jwt.sign({ user }, config.secret_jwt, { expiresIn: "24h" });
};

export const extractCookie = (req) => {
  return req && req.cookies ? req.cookies[config.secret_cookie] : null;
};

export const currentStrategy = (strategy) => {

  return async(req, res, next) => {
      passport.authenticate(strategy, function(err, user, info){
          if(err) return next(err)
          if(!user) {
              return res.status(401).send({
                  error: info.messages? info.messages : info.toString()
              })
          }
          req.user = user;
          next()
      }) (req, res, next)
  }
};

export const authorization = (rol) => {

  return async (req, res, next) => {
      const user = req.user;

      if(!user) return res.status(401).send({error: "No autorizado"})
      if(user.user.roles !== rol) return res.status(403).send({error: "Usuario no autorizado"})
  
      next()
  }
};


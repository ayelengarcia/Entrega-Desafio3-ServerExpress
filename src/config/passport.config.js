import passport from "passport";
import local from "passport-local";
import GitHubStrategy from "passport-github2";
import passportJWT from "passport-jwt";
import UserModel from "../Dao/mongoManager/models/userModel.js";
import CartModel from "../Dao/mongoManager/models/cartModel.js";
import {
  createHash,
  isValidPass,
  extractCookie,
  generateToken,
} from "../utils.js";

const LocalStrategy = local.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const initPassport = () => {
  //Login github
  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: "Iv1.c2c35b26dad584be",
        clientSecret: "b85ac61104c76571ca85988c7e61b7d5573a7b70",
        callbackURL: "http://127.0.0.1:8080/api/sessions/githubcallback",
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log(profile);
        try {
          const user = await UserModel.findOne({ email: profile._json.email })
            .lean()
            .exec();
          const cart = await CartModel.findOne();

          if (user) {
            console.log("El user ya existe ");
            const token = generateToken(user);
            user.token = token;
            return done(null, user);
          } else {
            const newUser = {
              first_name: profile._json.name,
              last_name: "",
              email: profile._json.email,
              age: 0,
              password: "",
              cart: cart._id,
              roles: "usuario",
            };

            const result = await UserModel.create(newUser);
            console.log(result);

            const token = generateToken(result);
            result.token = token;
            return done(null, result);
          }
        } catch (e) {
          return done(e);
        }
      }
    )
  );

  //Register local
  passport.use(
    "register",
    new LocalStrategy(
      // Objeto de configuracion
      {
        passReqToCallback: true,
        usernameField: "email",
      },
      //Lo que debe hacer
      async (req, username, password, done) => {
        const { first_name, last_name, email, age, roles } = req.body;
        try {
          const user = await UserModel.findOne({ email: username });
          const cart = await CartModel.findOne();

          if (user) {
            console.log("El user ya existe ");
            const token = generateToken(user);
            user.token = token;
          } else {
            const newUser = {
              first_name,
              last_name,
              email,
              password: createHash(password),
              age,
              cart: cart._id,
              roles,
            };

            const result = await UserModel.create(newUser);
            console.log(result);

            const token = generateToken(result);
            result.token = token;
            return done(null, result);
          }
        } catch (e) {
          return done(e);
        }
      }
    )
  );

  //Login local
  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (username, password, done) => {
        try {
          const user = await UserModel.findOne({ email: username })
            .lean()
            .exec();
          if (!user) {
            console.log("El usuario no existe");
            return done(null, false);
          }
          if (!isValidPass(user, password)) {
            console.log("Contraseña incorrecta");
            return done(null, false);
          }

          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    )
  );

  //Autenticación. Extrae y valida el JWT
  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([extractCookie]),
        secretOrKey: "secretForJWT",
      },
      (jwt_payload, done) => {
        console.log({ jwt_payload });
        return done(null, jwt_payload);
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await UserModel.findById(id);
    done(null, user);
  });
};

export default initPassport;

// http://127.0.0.1:8080/githubcallback

// App ID: 378939
// Client ID: Iv1.c2c35b26dad584be

//Client Secret
// b85ac61104c76571ca85988c7e61b7d5573a7b70

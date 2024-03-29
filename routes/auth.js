var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res, next) => {
  try {
    // parameters exists

    // valid parameters
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
      // profilePic: req.body.profilePic
    }
    let users = [];
    users = await DButils.execQuery("SELECT username from users");

    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Username taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
      `INSERT INTO users (username, email, password, country, firstname, lastname) VALUES ('${user_details.username}', '${user_details.email}', '${hash_password}', '${user_details.country}', '${user_details.firstname}', '${user_details.lastname}')`
    )

    // GET the user from db
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${user_details.username}'`
      )
    )[0];
    
    // add watched recepies informaion
    await DButils.execQuery(`INSERT INTO watchedrecipes (user_id, recipe_id_1, recipe_id_2, recipe_id_3) VALUES ('${user.user_id}', NULL, NULL, NULL)`)

    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }
    const res_user = {
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      country: user.country,
      email: user.email,
    }
    // Set cookie
    req.session.user_id = user.user_id;
    // return cookie
    res.status(200).send({ message: "login succeeded", success: true, user: res_user});
  } catch (error) {
    next(error);
  }
});

router.post("/logout", function (req, res) {
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;
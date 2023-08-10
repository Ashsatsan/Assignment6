const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

// user schema
const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

const MONGO_DB_URL =
  "mongodb+srv://singh:4Singh_123@senecaweb.himylrj.mongodb.net/?retryWrites=true&w=majority";
const initialize = function () {
  return new Promise(function (resolve, reject) {
    const db = mongoose.createConnection(MONGO_DB_URL);
    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

const registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    // ensure password2 & password match
    if (userData.password !== userData.password2) {
      // they don't match
      reject("Passwords do not match");
    } else {
      // hashing password
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;

          const user = new User(userData);

          // save the user
          user
            .save()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              // check duplicate error code
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch((err) => {
          console.log(err);
          reject("There was an error encrypting the password");
        });
    }
  });
};

const checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    // find user by give user name
    User.find({ userName: userData.userName })
      .then((users) => {
        // check number of users returned
        // if = 0, then there are no users with that given username
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
        } else {
          const user = users[0]; // assign first User

          // compare the hashed password and the plain password
          // if they match (i.e results === true), then user can be logged in
          const plainPassword = userData.password;
          bcrypt
            .compare(plainPassword, user.password)
            .then((results) => {
              // they match
              if (results === true) {
                // push history
                user.loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });

                // update history
                User.updateOne(
                  { userName: user.userName },
                  { $set: { loginHistory: user.loginHistory } }
                )
                  .then(() => resolve(user))
                  .catch((err) => {
                    reject("There was an error updating the user: " + err);
                  });
              } else {
                // passwords don't match
                reject("Incorrect Password for user: " + userData.userName);
              }
            })
            .catch((err) => {
              // there was error while comparing passwords
              reject("There was an error verifying the user: " + err);
            });
        }
      })
      .catch((err) => {
        // there was error finding user with given username
        console.log(err);
        reject("Unable to find user: " + userData.userName);
      });
  });
};

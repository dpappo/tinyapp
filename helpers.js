
const checkEmailExists = function(email, database) {
  for (let item in database) {
    if (database[item].email === email) {
      return true;
    }
  } return false;
};

const getUserByEmail = function(email, database) {
  for (let item in database) {
    if (database[item].email === email) {
      console.log(item);
      return item;
    }
  }
};

const urlsForUser = function(userID, database) {
  const returnObject = {};

  for (let item in database) {
    if (database[item].userID === userID) {
      returnObject[item] = {longURL: database[item].longURL, userID: userID};
    }
  }
  return returnObject;
};

const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};

module.exports = {checkEmailExists,
  getUserByEmail,
  urlsForUser,
  generateRandomString};
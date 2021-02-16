const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "zosdkg": {
    id: "zosdkg",
    email: "testing@google.com",
    password: "lololol"
  }
};

app.get('/', (req, res) => {
  const templateVars = {urls: urlDatabase,
    email: users[req.cookies["userID"]].email
  };
  res.render("urls_index", templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    email: users[req.cookies["userID"]].email
  };
  res.render('urls_new', templateVars);
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase,
    email: users[req.cookies["userID"]].email
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],
    email: users[req.cookies["userID"]].email
  };
  res.render("urls_show", templateVars);
});

app.get('/register', (req, res) => {
  const templateVars = {
    email: undefined
  };
  res.render("register", templateVars);
});

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = req.body.longURL;
  res.redirect('/urls/' + shortenedURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.updatedURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect(`/urls/`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect(`/register`);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.sendStatus(400);
  } else if (emailDuplicateLookup(req.body.email, users)) {
    res.sendStatus(400);
  } else {
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('userID', userID);
    res.redirect(`/urls/`);
  }
});

const emailDuplicateLookup = function(email, database) {
  for (let item in database) {
    if (database[item].email === email) {
      return true;
    }
  } return false;
};

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  
  res.redirect(longURL);
});

const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
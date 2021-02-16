const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const urlDatabase = {
  'b6UTxQ': { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  'i3BoGr': { longURL: "https://www.google.ca", userID: "aJ48lW" }
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
  if (users[req.cookies["userID"]] !== undefined) {
    const templateVars = {
      email: users[req.cookies["userID"]].email
    };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase,
    email: users[req.cookies["userID"]].email
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL,
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

app.get('/login', (req, res) => {
  const templateVars = {
    email: undefined
  };
  res.render("login", templateVars);
});

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["userID"]
  };
  console.log(urlDatabase);
  res.redirect('/urls/' + shortenedURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;

  if (checkEmailExists(email, users) && pass === users[lookupIDFromEmail(email, users)].password) {
    res.cookie('userID', lookupIDFromEmail(email, users));
    res.redirect(`/urls/`);
  } else if (!checkEmailExists(email, users)) {
    res.status(403).send("User does not exist");
  } else if (checkEmailExists(email, users) && pass !== users[lookupIDFromEmail(email, users)]) {
    res.status(403).send("Wrong password mate, try again");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect(`/login`);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email and password required");
  } else if (checkEmailExists(req.body.email, users)) {
    res.status(400).send("Email already registered");
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

const checkEmailExists = function(email, database) {
  for (let item in database) {
    if (database[item].email === email) {
      return true;
    }
  } return false;
};

const lookupIDFromEmail = function(email, database) {
  for (let item in database) {
    if (database[item].email === email) {
      return item;
    }
  }
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
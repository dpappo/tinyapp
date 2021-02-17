const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const {checkEmailExists,
  getUserByEmail,
  urlsForUser,
  generateRandomString} = require("./helpers");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["g-d"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


const urlDatabase = {
  'b6UTxQ': { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  'i3BoGr': { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "dpappo@gmail.com",
    password: bcrypt.hashSync("a", 10)
  }
};

app.get('/', (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    const templateVars = {
      urls: urlDatabase,
      email: users[req.session.user_id].email
    };
    res.render('urls_index', templateVars);
  } else {
    res.send("You have to log in first");
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    const templateVars = {
      email: users[req.session.user_id].email
    };
    res.render('urls_new', templateVars);
  } else {
    res.send("You have to log in first");
  }
});

app.get('/urls', (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    const templateVars = {
      urls: urlsForUser(req.session.user_id,urlDatabase),
      email: users[req.session.user_id].email
    };
    res.render('urls_index', templateVars);
  } else {
    res.send("You have to log in first");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL,
    email: users[req.session.user_id].email
  };

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.send("This is not your URL");
  } else {
    res.render("urls_show", templateVars);
  }

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

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  console.log(urlDatabase);
  res.redirect('/urls/' + shortenedURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.send("This is not your URL");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  // res.redirect(`/urls/${req.params.shortURL}`);
  
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.send("This is not your URL");
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }

});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;

  if (checkEmailExists(email, users) && bcrypt.compareSync(pass, users[getUserByEmail(email, users)].password)) {
    req.session.user_id = ('userID', getUserByEmail(email, users));
    res.redirect(`/urls/`);
  } else if (!checkEmailExists(email, users)) {
    res.status(403).send("User does not exist");
  } else if (checkEmailExists(email, users) && !bcrypt.compareSync(pass, users[getUserByEmail(email, users)])) {
    res.status(403).send("Wrong password mate, try again");
  }

});

app.post("/logout", (req, res) => {
  req.session = null;
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
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = ('userID', userID);
    res.redirect(`/urls/`);
  }
});




app.listen(PORT, () => {
  console.log(`TinyApp Server listening on port ${PORT}`);
});
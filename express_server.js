const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// helper functions
const {checkEmailExists,
  getUserByEmail,
  urlsForUser,
  generateRandomString} = require("./helpers");

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["g-d"],
  maxAge: 24 * 60 * 60 * 1000
}));

// for this project, we have two objects below acting as simple data stores
const urlDatabase = {
  'b6UTxQ': { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  'i3BoGr': { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "dpappo@gmail.com",
    password: bcrypt.hashSync("a", 10)
  }
};

// gets:
app.get('/', (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    const templateVars = {
      urls: urlDatabase,
      email: users[req.session.user_id].email
    };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = {
      urls: urlDatabase,
      email: undefined
    };
    res.render('login', templateVars);
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
    const templateVars = {
      urls: urlDatabase,
      email: undefined
    };
    res.render('login', templateVars);
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
    const templateVars = {error: 401,
      message: `You have to log in first`,
      link: "/login"};
    res.status(401).render("error", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!users[req.session.user_id]) {
    const templateVars = {error: 401,
      message: `You have to log in first`,
      link: "/login"};
    res.status(401).render("error", templateVars);
  }
  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL,
    email: users[req.session.user_id].email
  };

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {error: 403,
      message: `This is not your URL`,
      link: "/login"};
    res.status(403).render("error", templateVars);
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

//posts:

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect('/urls/' + shortenedURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {error: 403,
      message: `This is not your URL`,
      link: "/login"};
    res.status(403).render("error", templateVars);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {error: 403,
      message: `This is not your URL`,
      link: "/login"};
    res.status(403).render("error", templateVars);
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;
  // if user exists, and password matches:
  if (checkEmailExists(email, users) && bcrypt.compareSync(pass, users[getUserByEmail(email, users)].password)) {
    req.session.user_id = ('userID', getUserByEmail(email, users));
    res.redirect(`/urls/`);
    // users does not exist
  } else if (!checkEmailExists(email, users)) {
    const templateVars = {error: 403,
      message: `User does not exist`,
      link: "/register"};
    res.status(403).render("error", templateVars);
    // if user exists, but password does not match:
  } else if (checkEmailExists(email, users) && !bcrypt.compareSync(pass, users[getUserByEmail(email, users)].password)) {
    const templateVars = {error: 403,
      message: `Wrong password mate, try again`,
      link: "/login"};
    res.status(403).render("error", templateVars);
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/login`);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = {error: 406,
      message: `Email and password required`,
      link: "/register"};
    res.status(400).render("error", templateVars);

  } else if (checkEmailExists(req.body.email, users)) {
    const templateVars = {error: 406,
      message: `Email already registered`,
      link: "/login"};
    res.status(400).render("error", templateVars);
  } else {
    // register user if all goes well
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
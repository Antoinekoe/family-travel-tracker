import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "2112Nono$",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Antoine", color: "teal" },
  { id: 2, name: "Elsa", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  let currentColor = users.find(
    (user) => user.id === Number(currentUserId)
  )?.color;
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentColor,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});
app.post("/user", async (req, res) => {
  try {
    if (!req.body.user) {
      res.render("new.ejs");
    } else {
      currentUserId = req.body.user;
      res.redirect("/");
    }
  } catch (error) {}
});

app.post("/new", async (req, res) => {
  const result = await db.query(
    "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id, name, color",
    [req.body.name, req.body.color]
  );
  currentUserId = result.rows[0].id;
  users.push({
    id: result.rows[0].id,
    name: result.rows[0].name,
    color: result.rows[0].color,
  });
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

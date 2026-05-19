const express = require("express");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/health", async (req, res) => {
  try {

    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Сайт и база работают",
      time: result.rows[0].now
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "База не подключилась"
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {

    const {
      full_name,
      username,
      password
    } = req.body;

    const checkUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (checkUser.rows.length > 0) {

      return res.status(400).json({
        error: "Пользователь уже существует"
      });
    }

    await pool.query(
      `
      INSERT INTO users
      (
        full_name,
        username,
        password_hash,
        role,
        department
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        full_name,
        username,
        password,
        "employee",
        "ЦИТ"
      ]
    );

    res.json({
      message: "Регистрация успешна"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка регистрации"
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {

    const {
      username,
      password
    } = req.body;

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        username,
        role,
        department
      FROM users
      WHERE username = $1
      AND password_hash = $2
      `,
      [username, password]
    );

    if (result.rows.length === 0) {

      return res.status(401).json({
        error: "Неверный логин или пароль"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка авторизации"
    });
  }
});

app.post("/api/requests", async (req, res) => {
  try {

    const {
      user_id,
      type,
      department,
      office,
      description,
      priority,
      file_name
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO requests
      (
        user_id,
        type,
        department,
        office,
        description,
        priority,
        status,
        file_name
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      RETURNING *
      `,
      [
        user_id,
        type,
        department,
        office,
        description,
        priority,
        "Новая",
        file_name || null
      ]
    );

    res.json({
      message: "Заявка создана",
      request: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка создания заявки"
    });
  }
});

app.get("/api/requests", async (req, res) => {
  try {

    const {
      user_id,
      role
    } = req.query;

    let result;

    if (role === "aho") {

      result = await pool.query(`
        SELECT
          requests.*,
          users.full_name AS user_name
        FROM requests
        LEFT JOIN users
        ON users.id = requests.user_id
        ORDER BY requests.id DESC
      `);

    } else {

      result = await pool.query(
        `
        SELECT
          requests.*,
          users.full_name AS user_name
        FROM requests
        LEFT JOIN users
        ON users.id = requests.user_id
        WHERE requests.user_id = $1
        ORDER BY requests.id DESC
        `,
        [user_id]
      );
    }

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка получения заявок"
    });
  }
});

app.put("/api/requests/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const {
      status,
      aho_comment
    } = req.body;

    const result = await pool.query(
      `
      UPDATE requests
      SET
        status = $1,
        aho_comment = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [
        status,
        aho_comment || null,
        id
      ]
    );

    res.json({
      message: "Заявка обновлена",
      request: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка обновления заявки"
    });
  }
});


app.get("/api/feedback", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        feedback.id,
        feedback.user_id,
        feedback.message,
        feedback.created_at,
        COALESCE(users.full_name, 'Пользователь') AS user_name
      FROM feedback
      LEFT JOIN users
      ON users.id = feedback.user_id
      ORDER BY feedback.id DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка получения отзывов"
    });
  }
});

app.post("/api/feedback", async (req, res) => {
  try {

    const {
      user_id,
      message
    } = req.body;

    await pool.query(
      `
      INSERT INTO feedback
      (
        user_id,
        message
      )
      VALUES ($1,$2)
      `,
      [user_id, message]
    );

    res.json({
      message: "Сообщение отправлено"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Ошибка отправки"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Сайт открыт на порту ${PORT}`);
});
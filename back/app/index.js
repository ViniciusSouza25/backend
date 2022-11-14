const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const urlEncodedParser = bodyParser.urlencoded({ extended: false });

const sqlite3 = require("sqlite3").verbose();
const DBPATH = "../db/db.db";
const hostname = "127.0.0.1";
const port = 8080;
const app = express();

/* Servidor aplicação */

app.use(express.json());
app.use(urlEncodedParser);

app.use(
  express.static(path.resolve(__dirname, "../html"), { extensions: ["html"] })
);

app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Isso é importante para evitar o erro de CORS

  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().getTime();

  console.log(`Init | ${timestamp}: ${req.path} - ${req.method}`);

  res.on("finish", () => {
    console.log(
      `Finish | ${timestamp}: ${req.path} - ${req.method} => Status: ${res.statusCode} => Message: ${res.statusMessage}`
    );
  });

  next();
});

app.use("/css", express.static(path.resolve(__dirname, "../css")));
app.use("/assets", express.static(path.resolve(__dirname, "../assets")));

async function accessDB(sql = "", params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(path.resolve(__dirname, DBPATH)); // Abre o banco

    db.all(sql, params, (err, rows) => {
      db.close();

      if (err) {
        console.error(err);
        return reject(err);
      }

      return resolve(rows);
    });
  });
}

/* Definição dos endpoints */

/******** CRUD ************/

app.get("/", (_, res) => {
  res.send("ok").status(200);
});

// Retorna todos registros (é o R do CRUD - Read)
app.get("/pessoas", async (_, res) => {
  const pessoas = await accessDB("SELECT * FROM pessoas");

  res.status(200).send(pessoas);
});

app.get("/pessoas/:id", async (_, res) => {
  const idPessoa = req.params.id;

  if (!idPessoa) {
    return res.sendStatus(400);
  }

  const pessoas = await accessDB("SELECT * FROM pessoas where id = ?", [
    idPessoa,
  ]);

  res.status(200).send(pessoas);
});

// Insere um registro (é o C do CRUD - Create)
app.post("/adicionar-pessoa", async (req, res) => {
  const nome = req.body.nome;

  if (!nome) return res.sendStatus(400);

  await accessDB("INSERT INTO pessoas (nome) VALUES (?)", [nome]);

  res.sendStatus(201);
});

// Insere um registro (é o C do CRUD - Create)
app.post("/adicionar-sala", async (req, res) => {
  const nome = req.body.nome;

  if (!nome) return res.sendStatus(400);

  await accessDB("INSERT INTO salas (nome) VALUES (?)", [nome]);

  res.sendStatus(201);
});


// Atualiza um registro (é o U do CRUD - Update)
app.post("/registrar-passagem", async (req, res) => {
  const idPessoa = req.body.idPessoa;
  const idSala = req.body.idSala;
  const dataEntrada = req.body.dataEntrada;
  const dataSaida = req.body.dataSaida;

  if (!idPessoa || typeof idPessoa !== "number" || isNaN(idPessoa)) {
    return res.sendStatus(400);
  }

  if (!idSala || typeof idSala !== "number" || isNaN(idSala)) {
    return res.sendStatus(400);
  }

  if (dataEntrada && typeof dataEntrada !== "string") {
    return res.sendStatus(400);
  }

  if (dataSaida && typeof dataSaida !== "string") {
    return res.sendStatus(400);
  }

  const registros = await accessDB(
    "SELECT * FROM pessoas_salas WHERE id_pessoa = ?",
    [idPessoa]
  );

  const [registro] = registros || [];

  if (!registro) {
    await accessDB(
      "INSERT INTO pessoas_salas (id_pessoa, id_sala, data_entrada, data_saida) VALUES (?, ?, ?, ?)",
      [idPessoa, idSala, dataEntrada, dataSaida]
    );

    return res.sendStatus(201);
  }

  await accessDB(
    "UPDATE pessoas_salas SET id_sala = ?, data_entrada = ?, data_saida = ? WHERE id_pessoa = ?",
    [idSala, dataEntrada, dataSaida, idPessoa]
  );

  res.sendStatus(200);
});

// Exclui um registro (é o D do CRUD - Delete)
app.post("/remover-pessoa", (req, res) => {});

app.listen(port, hostname, () => {
  console.log(`Page server running at http://${hostname}:${port}/`);
});

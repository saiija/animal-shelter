const express = require("express");
const cors = require("cors");
const path = require("path");
const { db, initDatabase } = require("./database");

// luodaan Express-sovellus
const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

// alustetaan tietokanta kun palvelin käynnistetään
initDatabase();

// GET /animals - palauttaa kaikki adoptoitavat eläimet
app.get("/animals", (req, res) => {
  db.all("SELECT * FROM animals", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Tietokantavirhe" });
    res.json(rows);
  });
});

// GET /animals/:id - palauttaa yhden eläimen id:n perusteella
app.get("/animals/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM animals WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Tietokantavirhe" });
    if (!row) return res.status(404).json({ error: "Eläintä ei löytynyt" });
    res.json(row);
  });
});

// POST /animals/:id/adopt - adoptiohakemus vastaanotetaan
app.post("/animals/:id/adopt", (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, message } = req.body;

  // tarkistaa pakolliset kentät
  if (!name || !email) {
    return res.status(400).json({ error: "name ja email ovat pakollisia" });
  }

  // haetaan eläin tietokannasta
  db.get("SELECT * FROM animals WHERE id = ?", [id], (err, animal) => {
    if (err) return res.status(500).json({ error: "Tietokantavirhe" });
    if (!animal) return res.status(404).json({ error: "Eläintä ei löytynyt" });

    // estetää saman eläimen adotoinnoin uudestaan
    if (animal.status === "adopted") {
      return res.status(409).json({ error: "Eläin on jo adoptoitu" });
    }

    // tallentaa adoptiohakemuksen
    db.run(
      `INSERT INTO adoptions (animal_id, applicant_name, applicant_email, applicant_phone, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, phone || "", message || ""],
      function (err2) {
        if (err2) return res.status(500).json({ error: "Tietokantavirhe" });

        // päivittää eläimen statuksen adotoiduksi
        db.run(
          "UPDATE animals SET status = 'adopted' WHERE id = ?",
          [id],
          (err3) => {
            if (err3) return res.status(500).json({ error: "Tietokantavirhe" });

            // palauttaa onnistuneen vastauksen frontendille
            res.status(201).json({
              message: "Adoptiohakemus vastaanotettu",
              adoptionId: this.lastID,
              animalId: id,
            });
          }
        );
      }
    );
  });
});

// käynnistetään palvelin
app.listen(3000, () => {
  console.log("Eläinsuoja API käynnissä: http://localhost:3000");
});
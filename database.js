const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./animals.db");

function initDatabase() {
  db.serialize(() => {
    console.log("Alustetaan tietokanta...");

    db.run(`
      CREATE TABLE IF NOT EXISTS animals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        age INTEGER NOT NULL,
        breed TEXT,
        description TEXT,
        image_url TEXT,
        status TEXT NOT NULL DEFAULT 'available'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS adoptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        animal_id INTEGER NOT NULL,
        applicant_name TEXT NOT NULL,
        applicant_email TEXT NOT NULL,
        applicant_phone TEXT,
        message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    db.get("SELECT COUNT(*) AS count FROM animals", (err, row) => {
      if (err) {
        console.error("Tietokantavirhe:", err);
        return;
      }

      if (row.count === 0) {
        console.log("Lisätään testieläimet...");

        const animals = [
          ["Mirri", "kissa", 3, "Maatiaiskissa", "Rauhallinen ja seurallinen. Tykkää nukkua auringossa.", "/images/kissa1.jpg", "available"],
          ["Rex", "koira", 1, "Whippet", "Reipas lenkkeilijä ja ihmisrakas. Osaa istua ja antaa tassua.", "/images/koira1.jpg", "available"],
          ["Luna", "kissa", 1, "Bengali", "Energinen ja utelias. Tarvitsee leikkiä päivittäin.", "/images/kissa2.jpg", "available"],
          ["Nelli", "koira", 1, "Labrador", "Kiltti ja leikkisä. Sopii lapsiperheeseen.", "/images/koira2.jpg", "available"],
          ["Sisu", "kissa", 4, "Maatiainen", "Pitää rapsutuksista. Rauhallinen koti etsinnässä.", "/images/kissa3.jpg", "available"]
        ];

        const stmt = db.prepare(`
          INSERT INTO animals (name, type, age, breed, description, image_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        animals.forEach((a) => stmt.run(a));
        stmt.finalize();
      } else {
        console.log("Tietokannassa on jo eläimiä, ei lisätä testidataa.");
      }
    });
  });
}

module.exports = { db, initDatabase };
"use strict";

const sqlite3 = require("sqlite3");

class Database {
  
  constructor(file) {
    this._database = new sqlite3.Database(file);
    this._initialize = this.run("CREATE TABLE IF NOT EXISTS donations ("
      + "donationID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
      + "active INTEGER NOT NULL DEFAULT 1, "
      + "name TEXT NOT NULL DEFAULT '', "
      + "type TEXT NOT NULL DEFAULT '', "
      + "anonymous INTEGER NOT NULL, "
      + "email TEXT NOT NULL DEFAULT '', "
      + "amount INTEGER NOT NULL, "
      + "payment TEXT NOT NULL DEFAULT '', "
      + "language TEXT DEFAULT NULL, "
      + "timestamp INTEGER NOT NULL DEFAULT 0)");
  }
  
  run(sql, options) {
    return new Promise((resolve, reject) => {
      this._database.run(sql, options, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
  
  query(sql) {
    return new Promise((resolve, reject) => {
      this._database.all(sql, (error, rows) => {
        if (error) return reject(error);
        resolve(rows);
      });
    });
  }
  
  selectDonations() {
    return this._initialize.then(() => {
      return this.query("SELECT name, anonymous, type, email, amount, timestamp FROM donations WHERE active = 1 ORDER BY timestamp")
    }).then((rows) => {
      return rows.map((row) => ({
        name: (row.anonymous == 0 ? row.name: null), 
        type: row.type,
        email: row.email,
        amount: row.amount,
        timestamp: new Date(row.timestamp*1000),
      }));
    });
  }
  
  insertDonation(donation) {
    return this._initialize.then(() => {
      let sql = "INSERT INTO donations (active, name, type, anonymous, email, amount, payment, language, timestamp) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)";
      let options = [donation.name, donation.type, donation.anonymous ? 1 : 0, donation.email, donation.amount, donation.payment, donation.language, Math.floor(donation.timestamp.getTime()/1000)];
      return this.run(sql, options);
    }).then(() => {
      return this.selectDonations();
    });
  }
}

module.exports = Database;

const fs = require("fs");
const path = require("path");
const { createPage, createAppWrapper, cleanPages } = require("/scripts/generate");

export default async function handler(req, res) {
  const database = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../../database.json"), "utf8"));

  await cleanPages();
  fs.mkdirSync(path.join(__dirname, "../../../../website/pages"));

  Promise.all([
    createAppWrapper({ config: database.config }),
    database.pages.map(({ config, header, body, footer }) => createPage(database, config, header, body, footer))
  ])
    .then(() => res.status(200).json({ published: true }))
    .catch(err => {
      console.error(err);
      res.status(500).json(err);
    });
}

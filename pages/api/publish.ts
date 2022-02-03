const fs = require("fs");
const path = require("path");
const { updateLocales, createPage, createAppWrapper, cleanPages } = require("/scripts/generate");

export default async function handler(req, res) {
  const database = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../../database.json"), "utf8"));
  console.log("database", database);

  await cleanPages();
  fs.mkdirSync(path.join(__dirname, "../../../../website/pages"));

  Promise.all([
    // Update translation
    updateLocales(database.locales),
    createAppWrapper(),
    database.pages.map(({ config, header, body, footer }) => createPage(config.path, header, body, footer))
  ])
    .then(() => res.status(200).json({ published: true }))
    .catch(err => {
      console.error(err);
      res.status(500).json(err);
    });
}

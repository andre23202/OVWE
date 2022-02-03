const fs = require("fs");
const path = require("path");
const del = require("del");
const blocks = require("../blocks");
const Handlebars = require("handlebars");

const root = path.join(__dirname, "../../../../");
const websitePath = path.join(root, "website");
const pagesPath = path.join(websitePath, "pages");

String.prototype.toObject = function( obj, value ) {
  var names = this.split('.');
  // If a value is given, remove the last name and keep it for later:
  var lastName = arguments.length === 2 ? names.pop() : false;
  // Walk the hierarchy, creating new objects where needed.
  // If the lastName was removed, then the last object is not set yet:
  for( var i = 0; i < names.length; i++ ) {
    obj = obj[ names[i] ] = obj[ names[i] ] || {};
  }
  // If a value was given, set it to the last name:
  if( lastName ) obj = obj[ lastName ] = value;
  // Return the last object in the hierarchy:
  return obj;
};

/** Write locales files
 * @params locale i18n Json format { fr, en, ... }
 * @return Promise
 */
const updateLocales = (locales = {}) => {
  return Promise.all(
    Object.entries(locales).map(
      ([lang, content]) =>
        new Promise(async (resolve, reject) => {
          await del(path.join(websitePath, `/public/locales/${lang}`));
          fs.mkdirSync(path.join(websitePath, `/public/locales/${lang}`));
          fs.writeFile(path.join(websitePath, `/public/locales/${lang}/common.json`), JSON.stringify(content), err => {
            if (err) reject(err);
            else resolve();
          });
        })
    )
  );
};

/** Write locales files
 * @params locale i18n Json format { fr, en, ... }
 * @return Promise
 */
const cleanPages = () => del(pagesPath);

/** Write _app file
 * @return Promise
 */
const createAppWrapper = ({ config }) =>
  new Promise((resolve, reject) => {
    const content = `import { appWithTranslation } from "next-i18next";
import "../styles/globals.css";

const config = JSON.parse('${JSON.stringify(config)}');

function MyApp({ Component, pageProps }) {
  pageProps.config = config;
  return <Component {...pageProps} />
}

export default appWithTranslation(MyApp)
  `;
    fs.writeFile(path.join(pagesPath, `_app.js`), content, err => {
      if (err) reject(err);
      else resolve();
    });
  });

const createPage = (database = {}, config = {}, header = {}, body = [], footer = []) =>
  new Promise((resolve, reject) => {
    const { locales } = database;
    let bodyCode = ``;
    const footerCode = ``;

    body.forEach(block => {
      if (blocks[block.type]) {
        const template = Handlebars.compile(blocks[block.type].html);
        bodyCode += template({ config, header, data: block.data });

        // Set translations
        Object.entries(blocks[block.type].data).forEach(([key, value]) => {
          Object.keys(locales).forEach(lang => {
            const trad = `${lang}.${config.path}.${blocks[block.type].id}.${key}`;
            if (block.data[key] && block.data[key][lang]) {
              trad.toObject(locales, block.data[key][lang]);
            } else if (value.default) trad.toObject(locales, value.default[lang] || "");
          });
        });
      }
    });

    const content = `
import { useTranslation, i18n } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";

const html = __html => ({ __html });

export default function Page({ config }) {
  const { t } = useTranslation();

  if (process.env.NODE_ENV === "development") {
    const router = useRouter();
    useEffect(() => {
      const timer = setInterval(() => {
        router.replace(router.asPath, undefined, {
          scroll: false,
        });
      }, 5000);
      return () => clearTimeout(timer);
    });
  }

  return [
    <Head>
      <title>{t("${header.title}")}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>${(bodyCode || footerCode) ? "," : ""}
    ${bodyCode ? `${bodyCode},` : ""}
    ${footerCode}
  ]
}

export async function getStaticProps({ locale }) {
  if (process.env.NODE_ENV === "development") {
    await i18n?.reloadResources();
  }

  return {
    props: {
      ...(await serverSideTranslations(locale))
    },
  };
}
  `;
    fs.writeFile(path.join(pagesPath, `${config.path}.js`), content, err => {
      if (err) reject(err);
      else {
        // Set menu translations
        Object.keys(locales).forEach(lang => {
          database.config.menus.forEach(({ id, title, items }) => {
            items.forEach(({ name, slug }) => {
              `${lang}.menu.${id}.${slug}`.toObject(locales, name[lang]);
            });
          });
        });
        console.log("locales", locales);
        updateLocales(locales)
          .then(resolve)
          .catch(reject);
      }
    });
  });

module.exports = { updateLocales, cleanPages, createAppWrapper, createPage };


import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Page() {
  const { t } = useTranslation("common");
  return [
    <Head>
      <title>{t("website.title")}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    
    
  ]
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      // Will be passed to the page component as props
    },
  };
}
  
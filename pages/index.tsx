import Head from "next/head";
import Dashboard from "/components/Dashboard";

export default function Home() {
  return (
    <div className="h-full">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Dashboard />
    </div>
  )
}

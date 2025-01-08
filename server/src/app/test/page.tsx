"use server";

import Client from "./client";

export default async function Home() {
  return (
    <main className="flex flex-col gap-8 items-center pt-10 ">
      <Client></Client>
    </main>
  );
}

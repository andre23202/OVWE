import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    JSON.parse(fs.writeFileSync("../../database.json", JSON.stringify(req.body)))
    res.status(200).send({ saved: true });
  } else {
    res.status(200).json(JSON.parse(fs.readFileSync("../../database.json", "utf8"));
  }
}

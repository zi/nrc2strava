import FormData from "form-data";
import { ReadStream } from "fs";
import fetch from "node-fetch";

async function importFile(file: ReadStream) {
  const form = new FormData();

  form.append("description", "Uploaded from NRC");
  form.append("data_type", "gpx");
  form.append("file", file);

  try {
    const response = await fetch("https://www.strava.com/api/v3/uploads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRAVA_BEARER}`,
      },
      body: form,
    });

    if (response.status === 401) {
      throw new Error("Strava token is not valid");
    }
    if (response.ok) {
      console.log(`Activity ${file} uploaded`);
    }
    throw new Error("Something went wrong");
  } catch (error) {
    console.warn(error);
  }
}
export { importFile };

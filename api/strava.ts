import FormData from "form-data";
import { ReadStream } from "fs";
import fetch from "node-fetch";

async function importFile(file: ReadStream) {
  const form = new FormData();

  form.append("description", "Uploaded from NRC");
  form.append("data_type", "gpx");
  form.append("file", file);

  const response = await fetch("https://www.strava.com/api/v3/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRAVA_BEARER}`,
    },
    body: form,
  });

  if (response.status === 401) {
    return Promise.reject("Strava token is not valid");
  }
  if (response.ok) {
    return Promise.resolve(`Activity ${file} uploaded`);
  }
  return await Promise.reject("Something went wrong");
}

export { importFile };

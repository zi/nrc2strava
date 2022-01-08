const FormData = require("form-data");
const fetch = require("node-fetch");

function importFile(file) {
  const form = new FormData();

  form.append("description", "Uploaded from NRC");
  form.append("data_type", "gpx");
  form.append("file", file);

  return fetch("https://www.strava.com/api/v3/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRAVA_BEARER}`,
    },
    body: form,
  }).then((res) => {
    if (res.status === 401) {
      return Promise.reject("Strava token is not valid");
    }

    if (res.ok) {
      return Promise.resolve(`Activity ${file} uploaded`);
    }

    return Promise.reject("Something went wrong");
  });
}

module.exports = { importFile };

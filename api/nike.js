const fetch = require("node-fetch");

async function nikeFetch(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.NIKE_BEARER}`,
    },
  });
  if (response.status === 401) {
    return Promise.reject("Nike token is not valid");
  }

  if (response.ok) {
    return response.json();
  }

  return Promise.reject("Something went wrong");
}

function getActivitiesByTime(time) {
  return nikeFetch(
    `https://api.nike.com/sport/v3/me/activities/after_time/${time}`
  );
}

function getActivityById(uuid) {
  return nikeFetch(
    `https://api.nike.com/sport/v3/me/activity/${uuid}?metrics=ALL`
  );
}

async function getActivitiesIds() {
  let ids = [];
  let timeOffset = 0;

  while (timeOffset !== undefined) {
    await getActivitiesByTime(timeOffset)
      .then((data) => {
        const { activities, paging } = data;

        if (activities === undefined) {
          timeOffset = undefined;

          return Promise.reject("Something went wrong. no activities found");
        }

        activities.forEach((a) => ids.push(a.id));
        timeOffset = paging.after_time;

        return Promise.resolve(
          `Successfully retrieved ${activities.length} ids`
        );
      })
      .then((msg) => console.log(msg))
      .catch((err) => console.log(err));
  }

  console.log(`Total ${ids.length} ids retrieved`);
  return ids;
}

module.exports = { getActivitiesIds, getActivityById };

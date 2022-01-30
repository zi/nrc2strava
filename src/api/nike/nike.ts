import fetch from "node-fetch";
import { NikeActivities, NikeActivity } from "./models";

async function nikeFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.NIKE_BEARER}`,
    },
  });
  if (response.status === 401) {
    throw new Error("Nike token is not valid");
  }

  if (response.ok) {
    return response.json();
  }

  throw new Error("Something went wrong");
}

function getActivitiesByTime(time: Date | number) {
  const milliseconds = typeof time === "number" ? time : time.getTime();
  return nikeFetch<NikeActivities>(
    `https://api.nike.com/sport/v3/me/activities/after_time/${milliseconds}`
  );
}

function getActivityById(uuid: string) {
  return nikeFetch<NikeActivity>(
    `https://api.nike.com/sport/v3/me/activity/${uuid}?metrics=ALL`
  );
}

async function getActivitiesIds(
  timeOffset: Date | number = 0,
  ids: Array<string> = []
): Promise<Array<string>> {
  const { activities, paging }: NikeActivities = await getActivitiesByTime(
    timeOffset
  );

  if (activities === undefined) {
    throw new Error("Something went wrong. no activities found");
  }

  console.log(`Successfully retrieved ${activities.length} ids`);

  const newIds = ids.concat(activities.map((activity) => activity.id));
  const hasMore = paging.after_time !== undefined;

  if (hasMore) {
    return getActivitiesIds(paging.after_time, newIds);
  }

  return newIds;
}

export { getActivitiesIds, getActivityById };

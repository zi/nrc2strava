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

function getActivitiesByTime(time?: number) {
  return nikeFetch<NikeActivities>(
    `https://api.nike.com/sport/v3/me/activities/after_time/${time}`
  );
}

function getActivityById(uuid: string) {
  return nikeFetch<NikeActivity>(
    `https://api.nike.com/sport/v3/me/activity/${uuid}?metrics=ALL`
  );
}

async function getActivitiesIds() {
  const ids: string[] = [];
  let timeOffset: number | undefined = 0;

  while (timeOffset !== undefined) {
    const { activities, paging }: NikeActivities = await getActivitiesByTime(
      timeOffset
    );

    if (activities === undefined) {
      timeOffset = undefined;
      throw new Error("Something went wrong. no activities found");
    }

    activities.forEach((activity) => ids.push(activity.id));
    timeOffset = paging.after_time;

    console.log(`Successfully retrieved ${activities.length} ids`);
  }

  console.log(`Total ${ids.length} ids retrieved`);
  return ids;
}

export { getActivitiesIds, getActivityById };

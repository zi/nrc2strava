import fetch from "node-fetch";
import { readStore, writeToStore } from "../../utils/store";
import { NikeActivities, NikeActivity } from "./models";

async function refreshToken(): Promise<void> {
  const store = await readStore();
  const response = await fetch(
    "https://unite.nike.com/tokenRefresh?appVersion=912&experienceVersion=912&uxid=com.nike.commerce.nikedotcom.web&locale=en_US&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=5&visitor=3fc75a47-3487-4ccc-84f8-78b8a8cf02c3",
    {
      body: `{"refresh_token":"${store.refresh_token}","client_id":"HlHa2Cje3ctlaOqnxvgZXNaAs7T9nAuH","grant_type":"refresh_token"}`,
      method: "POST",
    }
  );
  if (response.status === 401) {
    throw new Error("Nike refresh token is not valid");
  }
  const { access_token, refresh_token } = await response.json();

  await writeToStore({ ...store, access_token, refresh_token });
}

async function nikeFetch<T>(url: string): Promise<T> {
  const { access_token, refresh_token } = await readStore();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (response.status === 401) {
    if (!refresh_token) {
      throw new Error("Nike token is not valid");
    }
    await refreshToken();
    return nikeFetch<T>(url);
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

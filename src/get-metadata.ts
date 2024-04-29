import { exportVariable, getInput, warning } from "@actions/core";
import ogs from "open-graph-scraper";
import { Bookmark } from "./add-bookmark";
import { setImage } from "./set-image";
import { checkWaybackStatus } from "./wayback";

export async function getMetadata({
  url,
  notes,
  date,
  timestamp,
  tags,
  additionalProperties,
}: {
  url: string;
  notes?: string;
  date: string;
  timestamp: string;
  tags?: string;
  additionalProperties?: Record<string, string>;
}): Promise<Bookmark | undefined> {
  try {
    const { result } = await ogs({ url });
    exportVariable("BookmarkTitle", result.ogTitle);
    exportVariable("DateBookmarked", date);
    const image =
      getInput("export-image") === "true" ? await setImage(result) : "";
    const waybackResponse = await checkWaybackStatus(url);
    const waybackUrl = waybackResponse?.archived_snapshots?.closest?.url;
    if (!waybackUrl) {
      warning(`No wayback url found for ${url}`);
    }
    return {
      title: result.ogTitle || "",
      site: result.ogSiteName || "",
      author: result.author || "",
      date,
      timestamp,
      description: result.ogDescription || "",
      url: result.ogUrl || result.requestUrl || url,
      image,
      type: result.ogType || "",
      ...(notes && { notes }),
      ...(tags && { tags: toArray(tags) }),
      ...(waybackUrl && {
        waybackUrl,
      }),
      ...additionalProperties,
    };
  } catch (error) {
    warning(`Error getting metadata for ${url}: ${error.result.error}`);
    // throw new Error(`Error getting metadata for ${url}: ${error.result.error}`);
    return {
      title: "",
      site: "",
      author: "",
      date,
      timestamp,
      description: "",
      url: url,
      image: "",
      type: "",
      ...(notes && { notes }),
      ...(tags && { tags: toArray(tags) }),
      ...additionalProperties,
    };
  }
}

export function toArray(input: string): string[] {
  if (!input?.trim()) return [];
  return input.split(",").map((item) => item.trim());
}

import { NextResponse } from "next/server";
import { quickSearch } from "@/services/search/search-service";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await quickSearch(query));
}

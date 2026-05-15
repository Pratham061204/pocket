import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ rates: data.rates });
}

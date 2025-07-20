import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client and verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get source credentials
    const sourceId = process.env.ELECTRIC_SOURCE_ID;
    const sourceSecret = process.env.ELECTRIC_SOURCE_SECRET;

    if (!sourceId || !sourceSecret) {
      console.error("Missing Electric SQL source credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Build Electric SQL Cloud URL with source credentials
    const url = new URL(request.url);
    const electricUrl = new URL("https://api.electric-sql.cloud/v1/shape");

    // Copy all query parameters
    for (const [key, value] of url.searchParams.entries()) {
      electricUrl.searchParams.set(key, value);
    }

    // Add source credentials
    electricUrl.searchParams.set("source_id", sourceId);
    electricUrl.searchParams.set("source_secret", sourceSecret);

    // SECURITY: Automatically inject user filtering into ALL shapes
    // This ensures users can only access their own data, regardless of client request
    const existingWhere = electricUrl.searchParams.get("where");

    // Get existing params or create empty array
    const existingParams = electricUrl.searchParams.get("params");
    let params: string[] = [];

    if (existingParams) {
      try {
        params = JSON.parse(existingParams);
      } catch {
        // If params is not JSON, treat as single parameter
        params = [existingParams];
      }
    }

    // Add user ID to parameters array
    params.push(user.id);
    const userParamIndex = params.length;

    // Construct secure where clause with user filtering
    let secureWhere: string;
    if (existingWhere) {
      secureWhere = `(${existingWhere}) AND user_id = $${userParamIndex}`;
    } else {
      secureWhere = `user_id = $${userParamIndex}`;
    }

    electricUrl.searchParams.set("where", secureWhere);
    electricUrl.searchParams.set("params", JSON.stringify(params));

    // Forward request to Electric SQL Cloud
    const response = await fetch(electricUrl.toString(), {
      method: request.method,
      headers: {
        Accept: request.headers.get("Accept") || "application/json",
        "User-Agent": "Spendro/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        "Electric SQL API error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Electric SQL API error" },
        { status: response.status }
      );
    }

    // Stream response back to client
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
        "Cache-Control": response.headers.get("Cache-Control") || "no-cache",
      },
    });
  } catch (error) {
    console.error("Electric auth proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

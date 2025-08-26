import { NextRequest, NextResponse } from "next/server";
import { createClient } from "contentful-management";

export async function POST(request: NextRequest) {
  try {
    const { contentTypes, locale, environment, space } = await request.json();

    if (!contentTypes?.length || !locale || !environment || !space) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
    if (!managementToken) {
      return NextResponse.json(
        { error: "Configuration missing" },
        { status: 500 }
      );
    }

    const client = createClient({ accessToken: managementToken });
    const targetSpace = await client.getSpace(space);
    const targetEnvironment = await targetSpace.getEnvironment(environment);

    const entries = await fetchEntries(targetEnvironment, contentTypes, locale);

    const exportData = {
      exportDate: new Date().toISOString(),
      locale,
      environment,
      space,
      entries,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="content-export-${
          new Date().toISOString().split("T")[0]
        }.json"`,
        "Content-Length": blob.size.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

async function fetchEntries(
  environment: any,
  contentTypes: string[],
  locale: string
) {
  const allEntries: any[] = [];

  for (const contentTypeId of contentTypes) {
    let skip = 0;
    const limit = 25;

    while (true) {
      const entries = await environment.getEntries({
        content_type: contentTypeId,
        locale,
        limit,
        skip,
        include: 10, // No includes, just entries
      });

      if (entries.items.length === 0) break;

      const entriesData = entries.items.map((entry: any) => ({
        id: entry.sys.id,
        contentType: entry.sys.contentType.sys.id,
        fields: entry.fields,
        sys: {
          id: entry.sys.id,
          type: entry.sys.type,
          createdAt: entry.sys.createdAt,
          updatedAt: entry.sys.updatedAt,
          version: entry.sys.version,
        },
      }));

      allEntries.push(...entriesData);
      skip += limit;

      if (entries.items.length < limit || skip > 5000) break;
    }
  }

  return allEntries;
}

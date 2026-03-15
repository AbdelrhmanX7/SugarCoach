import { NextRequest, NextResponse } from "next/server";

import { parseDexcomCSV } from "@/lib/import/dexcom";
import { parseLibreCSV } from "@/lib/import/libre";
import { parseMySugrCSV, parseMySugrExcel } from "@/lib/import/mysugr";
import { NormalizedReading, normalizeReadings } from "@/lib/import/normalize";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = formData.get("source") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!source || !["libre", "dexcom", "mysugr"].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source. Must be libre, dexcom, or mysugr." },
        { status: 400 },
      );
    }

    const validSource = source as "libre" | "dexcom" | "mysugr";

    // Create initial import record
    const { data: importRecord, error: importCreateError } = await supabase
      .from("cgm_imports")
      .insert({
        user_id: user.id,
        source: validSource,
        file_name: file.name,
        status: "processing",
        records_imported: 0,
        import_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (importCreateError || !importRecord) {
      return NextResponse.json(
        { error: "Failed to create import record" },
        { status: 500 },
      );
    }

    const importId = importRecord.id;

    try {
      let readings: NormalizedReading[] = [];

      // Route to appropriate parser
      if (validSource === "libre") {
        const text = await file.text();

        readings = parseLibreCSV(text);
      } else if (validSource === "dexcom") {
        const text = await file.text();

        readings = parseDexcomCSV(text);
      } else if (validSource === "mysugr") {
        const isExcel =
          file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const result = parseMySugrExcel(buffer);

          readings = result.readings;
        } else {
          const text = await file.text();
          const result = parseMySugrCSV(text);

          readings = result.readings;
        }
      }

      // Normalize readings
      const normalized = normalizeReadings(readings);

      if (normalized.length === 0) {
        await supabase
          .from("cgm_imports")
          .update({
            status: "failed",
            error_message: "No valid readings found in the file.",
          })
          .eq("id", importId);

        return NextResponse.json(
          { error: "No valid readings found in the file." },
          { status: 400 },
        );
      }

      // Calculate date range
      const timestamps = normalized.map((r) => new Date(r.timestamp).getTime());
      const dateRangeStart = new Date(Math.min(...timestamps)).toISOString();
      const dateRangeEnd = new Date(Math.max(...timestamps)).toISOString();

      // Prepare records for bulk insert
      const records = normalized.map((r) => ({
        user_id: user.id,
        value: r.value,
        unit: r.unit,
        reading_time: r.timestamp,
        source: r.source,
        context: null,
        notes: null,
      }));

      // Bulk insert in batches of 500
      const BATCH_SIZE = 500;
      let totalInserted = 0;

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
          .from("blood_sugar_readings")
          .insert(batch);

        if (insertError) {
          throw new Error(`Failed to insert batch: ${insertError.message}`);
        }

        totalInserted += batch.length;
      }

      // Update import record with success
      await supabase
        .from("cgm_imports")
        .update({
          status: "completed",
          records_imported: totalInserted,
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd,
        })
        .eq("id", importId);

      return NextResponse.json({
        recordsImported: totalInserted,
        dateRange: {
          start: dateRangeStart,
          end: dateRangeEnd,
        },
        importId,
      });
    } catch (parseError) {
      // Mark import as failed
      const errorMessage =
        parseError instanceof Error ? parseError.message : "Unknown error";

      await supabase
        .from("cgm_imports")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", importId);

      return NextResponse.json(
        { error: `Import failed: ${errorMessage}` },
        { status: 400 },
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

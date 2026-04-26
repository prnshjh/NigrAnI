import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IngestPayload {
  camera_id: string;
  event_type: string;
  zone?: string;
  duration?: number;
  confidence: number;
  timestamp?: string;
}

function getRiskLevel(eventType: string, zone: string, confidence: number): "low" | "medium" | "high" {
  const highRiskEvents = ["INTRUSION", "PERIMETER_BREACH"];
  const mediumRiskEvents = ["LOITERING", "TAILGATING", "SUSPICIOUS_ACTIVITY"];
  if (highRiskEvents.includes(eventType) || confidence >= 0.9) return "high";
  if (mediumRiskEvents.includes(eventType) || confidence >= 0.75) return "medium";
  return "low";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: IngestPayload = await req.json();

    if (!payload.camera_id || !payload.event_type || payload.confidence === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: camera_id, event_type, confidence" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const timestamp = payload.timestamp ?? new Date().toISOString();
    const zone = payload.zone ?? "";
    const duration = payload.duration ?? 0;
    const confidence = Math.max(0, Math.min(1, payload.confidence));

    const { data: cameraData } = await supabase
      .from("cameras")
      .select("id, name")
      .eq("id", payload.camera_id)
      .maybeSingle();

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        camera_id: payload.camera_id,
        camera_uuid: cameraData?.id ?? null,
        event_type: payload.event_type.toUpperCase(),
        zone,
        duration,
        confidence,
        timestamp,
        raw_payload: payload as Record<string, unknown>,
      })
      .select("id")
      .single();

    if (eventError) {
      return new Response(
        JSON.stringify({ error: "Failed to store event", details: eventError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const riskLevel = getRiskLevel(payload.event_type.toUpperCase(), zone, confidence);

    const { error: alertError } = await supabase.from("alerts").insert({
      event_id: eventData.id,
      camera_id: cameraData?.id ?? null,
      camera_name: cameraData?.name ?? payload.camera_id,
      event_type: payload.event_type.toUpperCase(),
      zone,
      risk_level: riskLevel,
      confidence,
      is_read: false,
      timestamp,
    });

    if (alertError) {
      return new Response(
        JSON.stringify({ error: "Event stored but alert creation failed", event_id: eventData.id }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventData.id,
        risk_level: riskLevel,
        message: "Event ingested and alert created successfully",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

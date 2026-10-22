import { NextRequest, NextResponse } from "next/server";
import { fillAgreementPdf } from "@/lib/agreementPdf";
import { getSupabaseAdmin, toPublicSupabaseUrl } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { isLinkedParentOf } from "@/lib/chats";

function isDataUrlPng(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/png;base64,") && value.length > 100;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, role, studentName, guardianName, signedDate, studentSignaturePng, guardianSignaturePng, studentEmail } = body;

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (role !== "tutor" && role !== "tutee" && role !== "parent") {
    return NextResponse.json({ error: "Role must be 'tutor', 'tutee', or 'parent'." }, { status: 400 });
  }
  if (typeof studentName !== "string" || !studentName.trim()) {
    return NextResponse.json({ error: "Student name is required." }, { status: 400 });
  }
  if (typeof guardianName !== "string" || !guardianName.trim()) {
    return NextResponse.json({ error: "Parent/guardian name is required." }, { status: 400 });
  }
  if (typeof signedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(signedDate)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }
  if (!isDataUrlPng(guardianSignaturePng)) {
    return NextResponse.json({ error: "A guardian signature is required." }, { status: 400 });
  }

  // A parent signs through their own authenticated account, for a specific
  // linked child — unlike the student's own self-sign submission below,
  // this one feeds a real server-side gate (see app/api/chats POST), so it
  // can't just trust whatever email/studentEmail the request claims.
  let normalizedStudentEmail: string | null = null;
  if (role === "parent") {
    const callerEmail = await resolveAuthToken(req);
    if (!callerEmail || callerEmail !== email.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (typeof studentEmail !== "string" || !studentEmail.includes("@")) {
      return NextResponse.json({ error: "A student email is required." }, { status: 400 });
    }
    normalizedStudentEmail = studentEmail.trim().toLowerCase();
    if (!(await isLinkedParentOf(callerEmail, normalizedStudentEmail))) {
      return NextResponse.json({ error: "You're not linked to that student." }, { status: 403 });
    }
  } else if (!isDataUrlPng(studentSignaturePng)) {
    return NextResponse.json({ error: "Both signatures are required." }, { status: 400 });
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await fillAgreementPdf({
      role: role === "parent" ? "tutee" : role,
      studentName: studentName.trim(),
      guardianName: guardianName.trim(),
      signedDate,
      studentSignaturePng: role === "parent" ? undefined : studentSignaturePng,
      guardianSignaturePng,
    });
  } catch (err) {
    console.error("Failed to fill agreement PDF", err);
    return NextResponse.json({ error: "Could not generate the signed document." }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const storagePath = `${role}/${email.toLowerCase()}/${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("signed-agreements")
    .upload(storagePath, Buffer.from(pdfBytes), { contentType: "application/pdf" });
  if (uploadError) {
    console.error("Failed to upload signed agreement", uploadError);
    return NextResponse.json({ error: "Could not save the signed document." }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("agreements").insert({
    user_email: email.toLowerCase(),
    role,
    student_name: studentName.trim(),
    guardian_name: guardianName.trim(),
    signed_date: signedDate,
    pdf_storage_path: storagePath,
    student_email: normalizedStudentEmail,
  });
  if (insertError) {
    console.error("Failed to record signed agreement", insertError);
    return NextResponse.json({ error: "Could not record the signed document." }, { status: 500 });
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("signed-agreements")
    .createSignedUrl(storagePath, 300, { download: "peer-tutoring-agreement.pdf" });
  if (signedUrlError || !signedUrlData) {
    console.error("Failed to create download link", signedUrlError);
    return NextResponse.json({ error: "Signed, but could not create a download link." }, { status: 500 });
  }

  return NextResponse.json({ downloadUrl: toPublicSupabaseUrl(signedUrlData.signedUrl) });
}

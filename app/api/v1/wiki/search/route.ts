import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postBodySchema = z.object({
      query: z.string().min(1, "Query cannot be empty."),
    });

    const body = await req.json();
    const parsedBody = postBodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { query } = parsedBody.data;

    // Fetch user profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, roles:role_id(name)")
      .eq("id", user.id)
      .single();

    const userRole = profile?.roles?.name || profile?.membership_classification || "learner";

    // Direct database query with ILIKE search and role hierarchy filtering
    const cleanQuery = query.trim();
    let dbQuery = supabase
      .from("institutional_wiki_docs")
      .select("*")
      .or(`title.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%`);

    if (userRole !== "super_admin" && userRole !== "administrator" && userRole !== "president") {
      if (userRole === "tutor") {
        dbQuery = dbQuery.in("access_role", ["learner", "tutor"]);
      } else {
        dbQuery = dbQuery.eq("access_role", "learner");
      }
    }

    const { data: dbDocs } = await dbQuery.order("created_at", { ascending: false });

    // Seed default institutional docs if table is empty
    let activeDocs = dbDocs || [];

    if (activeDocs.length === 0 && cleanQuery.length > 0) {
      const { data: allDocs } = await supabase
        .from("institutional_wiki_docs")
        .select("*");

      if (!allDocs || allDocs.length === 0) {
        const initialDocs = [
          {
            title: "Peer Learning Center (PLC) Operating Procedure",
            category: "SOP",
            content: "Tutors must clock in at the PLC physical desk using QR Card Scanner. Shifts older than 2 hours require presence re-confirmation. Duty absences require 24h advance substitution request.",
            access_role: "learner",
          },
          {
            title: "ScholarMe Honor Code & Code of Ethics",
            category: "Governance",
            content: "All tutoring sessions, peer reviews, and study group discussions must maintain strict academic integrity. No-shows incur strikes, and 3 consecutive strikes lead to temporary suspension.",
            access_role: "learner",
          },
          {
            title: "Lead Tutor Mentorship Guidelines",
            category: "Tutor Manual",
            content: "Lead Tutors execute quarterly evaluations for junior tutors covering communication clarity, subject accuracy, and learner rapport. Peer reviews are consolidated under tutor_reviews.",
            access_role: "tutor",
          },
          {
            title: "Officer Handoff & Governance Transition SOP",
            category: "Governance",
            content: "Outgoing officers must log institutional handoff notes before academic term expiry on June 30. Notes are transferred automatically to incoming position assignees.",
            access_role: "committee_head",
          },
        ];

        const { data: inserted } = await supabase
          .from("institutional_wiki_docs")
          .insert(initialDocs)
          .select();

        if (inserted) {
          activeDocs = inserted.filter((d) => {
            const matchesRole = userRole === "super_admin" || userRole === "administrator" || userRole === "president" ||
              (userRole === "tutor" ? d.access_role === "learner" || d.access_role === "tutor" : d.access_role === "learner");
            const matchesTerm = d.title.toLowerCase().includes(cleanQuery.toLowerCase()) || d.content.toLowerCase().includes(cleanQuery.toLowerCase());
            return matchesRole && matchesTerm;
          });
        }
      }
    }

    const matchedDocs = activeDocs;

    const citations = matchedDocs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      content: d.content,
    }));

    let answer = "";
    if (matchedDocs.length > 0) {
      const { getAIClient, GEMINI_MODEL, GEMINI_TIMEOUT_MS } = await import("@/lib/ai/gemini");
      try {
        const ai = getAIClient();
        const contextStr = matchedDocs.map((d) => `Title: ${d.title}\nCategory: ${d.category}\nContent: ${d.content}`).join("\n\n");
        const prompt = `You are the ScholarMe Wiki Assistant. Given the following official institutional policies and SOPs, answer the user's query clearly, concisely, and beautifully using Markdown tables or lists where appropriate. Never invent information outside the context.\n\nContext:\n${contextStr}\n\nQuery: ${cleanQuery}`;
        
        const aiRes = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            temperature: 0.3,
            httpOptions: { timeout: GEMINI_TIMEOUT_MS }
          }
        });
        
        answer = aiRes.text || "";
      } catch (error) {
        console.error("LLM timeout or error in wiki synthesis:", error);
      }

      if (!answer) {
        // Fallback to static concatenation if LLM fails or no API key is present
        answer = `### 📚 Institutional Wiki Guidance (Fallback)\n\nBased on CIT-U Honor Society governance standards and official SOP documents:\n\n${matchedDocs
          .map((d, index) => `**[${index + 1}] ${d.title}** (${d.category || "General Policy"})\n> ${d.content}`)
          .join("\n\n")}\n\n*Need further clarification? Consult Kuya Nicolai.*`;
      }
    } else {
      answer = "No matching institutional policy or SOP document was found for your search term. Try searching for terms like 'PLC', 'Honor Code', 'Tutor SOP', or 'Handoff'.";
    }

    return NextResponse.json({ answer, citations });
  } catch (err: unknown) {
    console.error("Wiki search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

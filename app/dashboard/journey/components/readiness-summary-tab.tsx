"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserBadge, HsDesignation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ShieldCheck, Award, Clock, Briefcase, UserCheck } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReadinessSummaryTabProps {
  profile: Profile;
}

export function ReadinessSummaryTab({ profile }: ReadinessSummaryTabProps) {
  const supabase = createClient();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [tutorHours, setTutorHours] = useState(0);
  const [tuteeHours, setTuteeHours] = useState(0);
  const [masterySubjects, setMasterySubjects] = useState<{ subject: string; verified_at: string }[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [designations, setDesignations] = useState<HsDesignation[]>([]);

  useEffect(() => {
    async function loadSummaryData() {
      try {
        setLoading(true);
        // 1. Fetch tutor hours
        const { data: tutorSessions } = await supabase
          .from("sessions")
          .select("start_time, end_time")
          .eq("tutor_id", profile.id)
          .eq("status", "completed");

        let tMins = 0;
        tutorSessions?.forEach((s) => {
          if (s.start_time && s.end_time) {
            const [sh, sm] = s.start_time.split(":").map(Number);
            const [eh, em] = s.end_time.split(":").map(Number);
            tMins += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
          } else {
            tMins += 60; // 1hr default fallback
          }
        });
        const tHours = Math.max(tutorSessions?.length || 0, Math.round(tMins / 60));

        // 2. Fetch tutee hours
        const { data: tuteeSessions } = await supabase
          .from("sessions")
          .select("start_time, end_time")
          .eq("learner_id", profile.id)
          .eq("status", "completed");

        let lMins = 0;
        tuteeSessions?.forEach((s) => {
          if (s.start_time && s.end_time) {
            const [sh, sm] = s.start_time.split(":").map(Number);
            const [eh, em] = s.end_time.split(":").map(Number);
            lMins += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
          } else {
            lMins += 60;
          }
        });
        const lHours = Math.max(tuteeSessions?.length || 0, Math.round(lMins / 60));

        setTutorHours(tHours);
        setTuteeHours(lHours);

        // 3. Fetch mastery subjects
        const { data: verifications } = await supabase
          .from("tutor_mastery_verifications")
          .select("subject_name, created_at")
          .eq("tutor_id", profile.id)
          .eq("status", "approved");

        setMasterySubjects(
          verifications?.map((v) => ({
            subject: v.subject_name,
            verified_at: new Date(v.created_at).toLocaleDateString(),
          })) || []
        );

        // 4. Fetch badges
        const { data: userBadges } = await supabase
          .from("user_badges")
          .select("*")
          .eq("user_id", profile.id);
        setBadges(userBadges || []);

        // 5. Fetch org leadership history
        const { data: hsDesigs } = await supabase
          .from("hs_designations")
          .select("*")
          .eq("user_id", profile.id);
        setDesignations(hsDesigs || []);
      } catch (err) {
        console.error("Error loading summary:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSummaryData();
  }, [profile.id, supabase]);

  const handleExportPDF = async () => {
    if (!summaryRef.current) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(summaryRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ScholarMe_Readiness_Summary_${profile.full_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Readiness Summary exported as PDF!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export PDF summary.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading readiness summary...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Industry Readiness Summary
          </h3>
          <p className="text-sm text-muted-foreground">
            A factual, un-scored activity record of your verified participation and leadership at CIT-U Honor Society.
          </p>
        </div>
        <Button onClick={handleExportPDF} disabled={exporting} className="gap-2">
          <Download className="h-4 w-4" />
          {exporting ? "Generating PDF..." : "Export as PDF"}
        </Button>
      </div>

      {/* Exportable Container */}
      <div ref={summaryRef} className="p-6 rounded-xl border bg-card shadow-sm space-y-6 text-card-foreground">
        {/* Header Header */}
        <div className="border-b pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">
              {profile.degree_program || "Degree Program Unspecified"} • Year {profile.year_level || 1}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Member ID: {profile.membership_number || profile.id.substring(0, 8)} • Email: {profile.email}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="font-semibold text-primary border-primary">
              CIT-U Honor Society Verified
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">
              Issued: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Factual Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
              <Clock className="h-4 w-4" /> Tutoring Hours
            </div>
            <div className="text-2xl font-bold">{tutorHours + tuteeHours} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tutorHours} hrs as Tutor • {tuteeHours} hrs as Tutee
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
              <ShieldCheck className="h-4 w-4" /> Mastery Verifications
            </div>
            <div className="text-2xl font-bold">{masterySubjects.length} subjects</div>
            <p className="text-xs text-muted-foreground mt-1">Faculty & Officer verified</p>
          </div>

          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
              <Briefcase className="h-4 w-4" /> Leadership History
            </div>
            <div className="text-2xl font-bold">{designations.length} positions</div>
            <p className="text-xs text-muted-foreground mt-1">Committee & Board terms</p>
          </div>
        </div>

        {/* Verified Subjects Detail */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Academic & Subject Mastery
          </h4>
          {masterySubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {masterySubjects.map((sub, i) => (
                <div key={i} className="p-2.5 rounded-md border bg-background text-xs flex justify-between items-center">
                  <span className="font-medium">{sub.subject}</span>
                  <span className="text-[10px] text-muted-foreground">Verified {sub.verified_at}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No mastery verifications on record yet.</p>
          )}
        </div>

        {/* Leadership Terms Detail */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-indigo-500" /> Executive & Leadership History
          </h4>
          {designations.length > 0 ? (
            <div className="space-y-2">
              {designations.map((desig) => (
                <div key={desig.id} className="p-2.5 rounded-md border bg-background text-xs flex justify-between items-center">
                  <span className="font-medium">{desig.position || desig.designation}</span>
                  <span className="text-muted-foreground">Academic Year {desig.academic_year}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No official org leadership terms recorded yet.</p>
          )}
        </div>

        {/* Badges Earned */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" /> Verified Achievements & Badges
          </h4>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <Badge key={b.id} variant="secondary" className="px-3 py-1 text-xs">
                  {b.badge_name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No badges earned yet.</p>
          )}
        </div>

        <div className="border-t pt-4 text-center text-[10px] text-muted-foreground">
          ScholarMe Industry Readiness Activity Record • Grounded in verified platform activity logs.
        </div>
      </div>
    </div>
  );
}

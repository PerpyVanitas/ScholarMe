"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, PortfolioSettings, TutorEndorsement, UserBadge, HsDesignation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, sanitizeExternalUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Share2, Globe, Lock, ShieldCheck, Award, Clock, Briefcase, ExternalLink, Copy, Check, MessageSquareQuote } from "lucide-react";

interface PortfolioTabProps {
  profile: Profile;
}

export function PortfolioTab({ profile }: PortfolioTabProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [portfolioSettings, setPortfolioSettings] = useState<PortfolioSettings | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [customBio, setCustomBio] = useState("");
  const [copied, setCopied] = useState(false);

  // Data states
  const [tutoringHours, setTutoringHours] = useState<number>(0);
  const [masterySubjects, setMasterySubjects] = useState<{ subject: string; verified_at: string }[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [designations, setDesignations] = useState<HsDesignation[]>([]);
  const [endorsements, setEndorsements] = useState<TutorEndorsement[]>([]);

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        setLoading(true);
        // 1. Fetch or create portfolio settings
        const { data: settings } = await supabase
          .from("portfolio_settings")
          .select("*")
          .eq("user_id", profile.id)
          .single();

        if (settings) {
          setPortfolioSettings(settings);
          setIsPublic(settings.is_public);
          setGithubUrl(settings.github_url || "");
          setResumeUrl(settings.resume_url || "");
          setCustomBio(settings.custom_bio || "");
        } else {
          // Initialize default portfolio settings
          const { data: newSettings } = await supabase
            .from("portfolio_settings")
            .insert({ user_id: profile.id, is_public: false })
            .select()
            .single();
          if (newSettings) {
            setPortfolioSettings(newSettings);
          }
        }

        // 2. Fetch verified tutoring hours from attendance_logs & sessions
        const { data: sessions } = await supabase
          .from("sessions")
          .select("start_time, end_time")
          .eq("tutor_id", profile.id)
          .eq("status", "completed");

        let sessionMins = 0;
        sessions?.forEach((s) => {
          if (s.start_time && s.end_time) {
            const [sh, sm] = s.start_time.split(":").map(Number);
            const [eh, em] = s.end_time.split(":").map(Number);
            sessionMins += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
          } else {
            sessionMins += 60;
          }
        });
        const hoursFromSessions = Math.round(sessionMins / 60);

        const { data: attendance } = await supabase
          .from("attendance_logs")
          .select("clock_in, clock_out")
          .eq("user_id", profile.id)
          .not("clock_out", "is", null);

        let totalAttendanceMinutes = 0;
        attendance?.forEach((log) => {
          if (log.clock_in && log.clock_out) {
            const start = new Date(log.clock_in).getTime();
            const end = new Date(log.clock_out).getTime();
            totalAttendanceMinutes += Math.max(0, (end - start) / (1000 * 60));
          }
        });

        const totalHours = hoursFromSessions + Math.round(totalAttendanceMinutes / 60);
        setTutoringHours(totalHours);

        // 3. Fetch mastery verifications
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

        // 6. Fetch endorsements
        const { data: endos } = await supabase
          .from("tutor_endorsements")
          .select("*, tutor:profiles!tutor_endorsements_tutor_id_fkey(full_name, avatar_url, email)")
          .eq("learner_id", profile.id)
          .eq("is_public", true);
        setEndorsements(endos || []);
      } catch (err) {
        console.error("Error loading portfolio:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, [profile.id, supabase]);

  const handleSaveSettings = async () => {
    try {
      const cleanGithub = sanitizeExternalUrl(githubUrl);
      const cleanResume = sanitizeExternalUrl(resumeUrl);

      const { error } = await supabase
        .from("portfolio_settings")
        .upsert({
          user_id: profile.id,
          is_public: isPublic,
          github_url: cleanGithub,
          resume_url: cleanResume,
          custom_bio: customBio.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Portfolio settings updated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update settings";
      toast.error(message);
    }
  };

  const shareUrl = typeof window !== "undefined" && portfolioSettings?.share_token
    ? `${window.location.origin}/portfolio/${portfolioSettings.share_token}`
    : "";

  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Public portfolio link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading portfolio data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Visibility & Link Controls */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Portfolio Sharing & Visibility
              </CardTitle>
              <CardDescription>
                Make your verified ScholarMe achievements shareable on resumes and LinkedIn.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
              {isPublic ? <Globe className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-medium">{isPublic ? "Public" : "Private"}</span>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPublic && (
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-xs bg-background/80" />
              <Button onClick={copyShareLink} variant="outline" size="sm" className="shrink-0 gap-1.5">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button asChild variant="default" size="sm" className="shrink-0 gap-1.5">
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Preview
                </a>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">GitHub Profile URL</label>
              <Input
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">External Resume Link</label>
              <Input
                placeholder="https://drive.google.com/..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Custom Summary / Bio</label>
            <Input
              placeholder="Short statement highlighting your academic and tutoring achievements..."
              value={customBio}
              onChange={(e) => setCustomBio(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} size="sm">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Card Preview */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={getAvatarUrl(profile.avatar_url)} data-avatar-img="true" />
              <AvatarFallback>{profile.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {profile.degree_program || "CIT-U Honor Society Member"} • Year {profile.year_level || 1}
              </p>
              {customBio && <p className="text-xs italic mt-1 text-foreground/90">{customBio}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg border bg-card">
              <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-xl font-bold">{tutoringHours}</div>
              <div className="text-xs text-muted-foreground">Verified Tutoring Hours</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <ShieldCheck className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
              <div className="text-xl font-bold">{masterySubjects.length}</div>
              <div className="text-xs text-muted-foreground">Mastery Subjects</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <Award className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <div className="text-xl font-bold">{badges.length}</div>
              <div className="text-xs text-muted-foreground">Badges Earned</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <Briefcase className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
              <div className="text-xl font-bold">{designations.length}</div>
              <div className="text-xs text-muted-foreground">Leadership Terms</div>
            </div>
          </div>

          {/* Verified Subjects */}
          {masterySubjects.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Mastery Subjects
              </h4>
              <div className="flex flex-wrap gap-2">
                {masterySubjects.map((sub, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 px-3 py-1">
                    <span>{sub.subject}</span>
                    <span className="text-[10px] text-muted-foreground">({sub.verified_at})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Org Leadership History */}
          {designations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-indigo-500" /> Org Leadership & Roles
              </h4>
              <div className="space-y-2">
                {designations.map((desig) => (
                  <div key={desig.id} className="p-2.5 rounded-md border text-xs flex justify-between items-center">
                    <span className="font-medium text-foreground">{desig.position || desig.designation}</span>
                    <span className="text-muted-foreground">AY {desig.academic_year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Endorsements */}
          {endorsements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <MessageSquareQuote className="h-4 w-4 text-primary" /> Tutor Endorsements
              </h4>
              <div className="space-y-2">
                {endorsements.map((endo) => (
                  <div key={endo.id} className="p-3 rounded-md border bg-muted/20 text-xs space-y-1">
                    <p className="italic text-foreground/90">&ldquo;{endo.content}&rdquo;</p>
                    <div className="text-[10px] text-muted-foreground text-right font-medium">
                      — {endo.tutors?.profiles?.full_name || "Verified Tutor"} ({new Date(endo.created_at).toLocaleDateString()})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

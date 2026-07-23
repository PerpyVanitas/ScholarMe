import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvatarUrl, sanitizeExternalUrl } from "@/lib/utils";
import { Clock, ShieldCheck, Award, Briefcase, ExternalLink, MessageSquareQuote } from "lucide-react";
import Link from "next/link";

interface PublicPortfolioPageProps {
  params: Promise<{ shareToken: string }>;
}

export default async function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  const { shareToken } = await params;
  const supabase = await createClient();

  // Fetch portfolio settings by share token
  const { data: settings } = await supabase
    .from("portfolio_settings")
    .select("*, profiles:user_id(*)")
    .eq("share_token", shareToken)
    .eq("is_public", true)
    .single();

  if (!settings || !settings.profiles) {
    notFound();
  }

  const profile = settings.profiles;

  // 1. Fetch verified tutoring hours
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("tutor_id", profile.id)
    .eq("status", "completed");
  const hoursFromSessions = (sessions?.length || 0) * 1;

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

  const tutoringHours = hoursFromSessions + Math.round(totalAttendanceMinutes / 60);

  // 2. Mastery verifications
  const { data: verifications } = await supabase
    .from("tutor_mastery_verifications")
    .select("subject_name, created_at")
    .eq("tutor_id", profile.id)
    .eq("status", "approved");

  // 3. Badges (filtered by featured_badges if curated)
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", profile.id);

  const featuredBadgeSet = settings.featured_badges && settings.featured_badges.length > 0
    ? new Set(settings.featured_badges)
    : null;

  const displayBadges = featuredBadgeSet
    ? (userBadges || []).filter((b) => featuredBadgeSet.has(b.badge_name || b.badge_id || b.id))
    : (userBadges || []);

  // 4. Org designations
  const { data: hsDesigs } = await supabase
    .from("hs_designations")
    .select("*")
    .eq("user_id", profile.id);

  // 5. Endorsements
  const { data: endos } = await supabase
    .from("tutor_endorsements")
    .select("*, tutor:profiles!tutor_endorsements_tutor_id_fkey(full_name, avatar_url, email)")
    .eq("learner_id", profile.id)
    .eq("is_public", true);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 md:p-12 flex justify-center">
      <div className="max-w-3xl w-full space-y-6">
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 border-b">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-primary">ScholarMe</span>
            <Badge variant="outline" className="text-xs">Verified Portfolio</Badge>
          </div>
          <Link href="/auth/login" className="text-xs text-muted-foreground hover:underline">
            Member Sign In
          </Link>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={getAvatarUrl(profile.avatar_url)} />
                <AvatarFallback>{profile.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">{profile.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {profile.degree_program || "CIT-U Honor Society Member"} • Year {profile.year_level || 1}
                </p>
                {settings.custom_bio && (
                  <p className="text-xs italic text-foreground/90 mt-1 max-w-lg">{settings.custom_bio}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                  {sanitizeExternalUrl(settings.github_url) && (
                    <a
                      href={sanitizeExternalUrl(settings.github_url)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> GitHub Profile
                    </a>
                  )}
                  {sanitizeExternalUrl(settings.resume_url) && (
                    <a
                      href={sanitizeExternalUrl(settings.resume_url)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Resume Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg border bg-card">
                <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-xl font-bold">{tutoringHours}</div>
                <div className="text-xs text-muted-foreground">Verified Hours</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <ShieldCheck className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                <div className="text-xl font-bold">{verifications?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Mastery Subjects</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <Award className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <div className="text-xl font-bold">{displayBadges.length}</div>
                <div className="text-xs text-muted-foreground">Badges</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <Briefcase className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
                <div className="text-xl font-bold">{hsDesigs?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Org Leadership</div>
              </div>
            </div>

            {/* Verified Subjects */}
            {verifications && verifications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Mastery Subjects
                </h4>
                <div className="flex flex-wrap gap-2">
                  {verifications.map((v, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 text-xs">
                      {v.subject_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Leadership History */}
            {hsDesigs && hsDesigs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-indigo-500" /> Org Leadership & Terms
                </h4>
                <div className="space-y-2">
                  {hsDesigs.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-md border text-xs flex justify-between items-center">
                      <span className="font-medium">{d.position || d.designation}</span>
                      <span className="text-muted-foreground">Academic Year {d.academic_year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Endorsements */}
            {endos && endos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <MessageSquareQuote className="h-4 w-4 text-primary" /> Tutor Endorsements
                </h4>
                <div className="space-y-2">
                  {endos.map((e) => (
                    <div key={e.id} className="p-3 rounded-md border bg-muted/20 text-xs space-y-1">
                      <p className="italic">&ldquo;{e.content}&rdquo;</p>
                      <div className="text-[10px] text-muted-foreground text-right font-medium">
                        — {e.tutor?.full_name || "Verified Tutor"} ({new Date(e.created_at).toLocaleDateString()})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

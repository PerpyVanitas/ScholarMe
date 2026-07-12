import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settingsData } = await supabase
    .from("organization_settings")
    .select("*")
    .limit(1)
    .single();

  async function updateSettings(formData: FormData) {
    "use server";
    const supabase = await createClient();
    
    const primaryColor = formData.get("primary_color") as string;
    const logoUrl = formData.get("logo_url") as string;
    const heroTitle = formData.get("hero_title") as string;
    const heroSubtitle = formData.get("hero_subtitle") as string;
    
    const { data: existing } = await supabase
      .from("organization_settings")
      .select("id")
      .limit(1)
      .single();
      
    if (existing) {
      await supabase
        .from("organization_settings")
        .update({
          primary_color: primaryColor,
          logo_url: logoUrl || null,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("organization_settings")
        .insert({
          primary_color: primaryColor,
          logo_url: logoUrl || null,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle
        });
    }
    
    revalidatePath("/");
    revalidatePath("/dashboard/admin/settings");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" /> Organization Settings
        </h1>
        <p className="text-muted-foreground">White-label and customize the platform appearance.</p>
      </div>
      
      <Card className="max-w-2xl border-border/60">
        <form action={updateSettings}>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Changes apply globally, including the public landing page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Theme Color (Hex)</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  id="primary_color" 
                  name="primary_color" 
                  type="color" 
                  className="w-16 h-10 p-1"
                  defaultValue={settingsData?.primary_color || "#0f172a"} 
                />
                <Input 
                  type="text" 
                  className="flex-1"
                  defaultValue={settingsData?.primary_color || "#0f172a"}
                  readOnly
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL (Optional)</Label>
              <Input 
                id="logo_url" 
                name="logo_url" 
                type="url" 
                placeholder="https://example.com/logo.png"
                defaultValue={settingsData?.logo_url || ""} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hero_title">Landing Page Hero Title</Label>
              <Input 
                id="hero_title" 
                name="hero_title" 
                defaultValue={settingsData?.hero_title || "Empowering Your Academic Journey"} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Landing Page Hero Subtitle</Label>
              <Input 
                id="hero_subtitle" 
                name="hero_subtitle" 
                defaultValue={settingsData?.hero_subtitle || "Join our platform to master your subjects with AI-driven tools."} 
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-muted/20">
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" /> Save Settings
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

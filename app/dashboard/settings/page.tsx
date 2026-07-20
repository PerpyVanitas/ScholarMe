"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { 
  Bell, 
  Monitor, 
  ShieldCheck, 
  Moon, 
  Sun,
  Laptop
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SiteSettingsPage() {
  const { theme, setTheme } = useTheme();
  
  // Local state for settings that don't have a backend table yet
  const [mounted, setMounted] = useState(false);
  
  const [settings, setSettings] = useState({
    emailOnBooked: true,
    emailOnReview: true,
    pushNotifications: false,
    reducedMotion: false,
    shareAnalytics: true,
    publicProfile: true,
  });

  // Load from local storage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("scholarme_local_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        // ignore parse error
      }
    }
  }, []);

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("scholarme_local_settings", JSON.stringify(newSettings));
    
    // Show toast for specific actions to feel more interactive
    if (key === "pushNotifications" && value) {
      toast.success("Push notifications enabled");
    } else if (key === "reducedMotion") {
      toast.success(value ? "Reduced motion enabled" : "Reduced motion disabled");
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch for theme

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Site Settings</h2>
          <p className="text-muted-foreground">
            Manage your local application preferences.
          </p>
        </div>
      </div>
      <Separator />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Notifications Card */}
          <TabsContent value="general" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="email-booked" className="text-base">Session Booked</Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email when a student books a session with you.
                </p>
              </div>
              <Switch 
                id="email-booked" 
                checked={settings.emailOnBooked}
                onCheckedChange={(c) => updateSetting("emailOnBooked", c)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="email-review" className="text-base">New Review</Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email when someone leaves you a review.
                </p>
              </div>
              <Switch 
                id="email-review" 
                checked={settings.emailOnReview}
                onCheckedChange={(c) => updateSetting("emailOnReview", c)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifs" className="text-base">Browser Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified of direct messages immediately.
                </p>
              </div>
              <Switch 
                id="push-notifs" 
                checked={settings.pushNotifications}
                onCheckedChange={(c) => updateSetting("pushNotifications", c)}
              />
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Display Card */}
        <TabsContent value="display" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Display
            </CardTitle>
            <CardDescription>Adjust visual preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base">Appearance</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                    theme === "light" ? "border-primary bg-accent" : "border-muted"
                  }`}
                >
                  <Sun className="mb-2 h-6 w-6" />
                  <span className="text-xs font-semibold">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                    theme === "dark" ? "border-primary bg-accent" : "border-muted"
                  }`}
                >
                  <Moon className="mb-2 h-6 w-6" />
                  <span className="text-xs font-semibold">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                    theme === "system" ? "border-primary bg-accent" : "border-muted"
                  }`}
                >
                  <Laptop className="mb-2 h-6 w-6" />
                  <span className="text-xs font-semibold">System</span>
                </button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="reduced-motion" className="text-base">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">
                  Minimize UI animations across the app.
                </p>
              </div>
              <Switch 
                id="reduced-motion" 
                checked={settings.reducedMotion}
                onCheckedChange={(c) => updateSetting("reducedMotion", c)}
              />
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Data & Privacy Card */}
        <TabsContent value="privacy" className="mt-0 md:col-span-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Data &amp; Privacy
            </CardTitle>
            <CardDescription>Manage your connected data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="public-profile" className="text-base">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow non-members to view your basic tutor profile.
                </p>
              </div>
              <Switch 
                id="public-profile" 
                checked={settings.publicProfile}
                onCheckedChange={(c) => updateSetting("publicProfile", c)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="share-analytics" className="text-base">Share Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve by sharing anonymous usage data.
                </p>
              </div>
              <Switch 
                id="share-analytics" 
                checked={settings.shareAnalytics}
                onCheckedChange={(c) => updateSetting("shareAnalytics", c)}
              />
            </div>
            
            <Separator />
            <div className="pt-2">
               <p className="text-sm text-muted-foreground">
                 Note: Account deletion and data exports are available in <strong>Profile Settings &rarr; Security</strong>.
               </p>
            </div>
          </CardContent>
        </Card>
        </TabsContent>
      </div>
      </Tabs>
    </div>
  );
}

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
  Laptop,
  Bot,
  Zap,
  Clock,
  VolumeX,
  Mail,
  Layers,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    notifyTutoring: true,
    notifyFinance: true,
    notifyGamification: true,
    notifyCommunity: true,
    notifySystem: true,
    quietHours: false,
  });

  const [digestFrequency, setDigestFrequency] = useState<"instant" | "daily" | "weekly" | "off">("daily");
  const [aiMode, setAiMode] = useState<"server" | "local">("server");

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
    const savedAiMode = localStorage.getItem("scholarme_ai_mode");
    if (savedAiMode === "local" || savedAiMode === "server") {
      setAiMode(savedAiMode);
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

  const updateAiMode = (mode: "server" | "local") => {
    setAiMode(mode);
    localStorage.setItem("scholarme_ai_mode", mode);
    toast.success(mode === "local" ? "AI Tutor set to Private Local" : "AI Tutor set to Fast Server AI");
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
        <TabsList className="mb-6 grid w-full grid-cols-5 max-w-[650px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="ai">AI Tutor</TabsTrigger>
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

        {/* Notifications Tab Content */}
        <TabsContent value="notifications" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Category Alert Channels
              </CardTitle>
              <CardDescription>
                Choose which types of system activity send notifications to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Tutoring & Sessions</Label>
                  <p className="text-xs text-muted-foreground">Bookings, reminders, and feedback notifications</p>
                </div>
                <Switch
                  checked={settings.notifyTutoring}
                  onCheckedChange={(c) => updateSetting("notifyTutoring", c)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Executive Finance</Label>
                  <p className="text-xs text-muted-foreground">Budget request approvals, liquidations, and petty cash alerts</p>
                </div>
                <Switch
                  checked={settings.notifyFinance}
                  onCheckedChange={(c) => updateSetting("notifyFinance", c)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Gamification & XP</Label>
                  <p className="text-xs text-muted-foreground">Level-ups, badge unlocks, and weekly streak reminders</p>
                </div>
                <Switch
                  checked={settings.notifyGamification}
                  onCheckedChange={(c) => updateSetting("notifyGamification", c)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Community & Forums</Label>
                  <p className="text-xs text-muted-foreground">Group activity, forum replies, and direct messages</p>
                </div>
                <Switch
                  checked={settings.notifyCommunity}
                  onCheckedChange={(c) => updateSetting("notifyCommunity", c)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Quiet Hours / Mute</Label>
                  <p className="text-xs text-muted-foreground">Pause all non-critical notifications between 10 PM and 7 AM</p>
                </div>
                <Switch
                  checked={settings.quietHours}
                  onCheckedChange={(c) => updateSetting("quietHours", c)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notification Digest Frequency
              </CardTitle>
              <CardDescription>
                Consolidate activity notifications into scheduled email summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={digestFrequency}
                onValueChange={(val) => {
                  setDigestFrequency(val as "instant" | "daily" | "weekly" | "off");
                  toast.success(`Notification digest set to ${val}`);
                }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instant" id="digest-instant" />
                  <Label htmlFor="digest-instant" className="text-sm font-normal">
                    <span className="font-semibold">Instant</span> — Deliver notifications immediately as events occur
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="digest-daily" />
                  <Label htmlFor="digest-daily" className="text-sm font-normal">
                    <span className="font-semibold">Daily Digest</span> — Send one summary email at 8:00 AM daily
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="digest-weekly" />
                  <Label htmlFor="digest-weekly" className="text-sm font-normal">
                    <span className="font-semibold">Weekly Summary</span> — Send a weekly digest every Monday morning
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="off" id="digest-off" />
                  <Label htmlFor="digest-off" className="text-sm font-normal">
                    <span className="font-semibold">Disabled</span> — Do not send email summaries
                  </Label>
                </div>
              </RadioGroup>
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

        {/* AI Tutor Card */}
        <TabsContent value="ai" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Tutor Mode
            </CardTitle>
            <CardDescription>Choose how Kuya Nicolai processes your messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={aiMode}
              onValueChange={(v) => updateAiMode(v as "server" | "local")}
              className="space-y-4"
            >
              <label
                htmlFor="ai-server"
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  aiMode === "server" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/40"
                }`}
              >
                <RadioGroupItem value="server" id="ai-server" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    Fast Server AI
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Powered by Google Gemini on our servers. Instant responses, no download required. Recommended for most users.
                  </p>
                </div>
              </label>

              <label
                htmlFor="ai-local"
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  aiMode === "local" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/40"
                }`}
              >
                <RadioGroupItem value="local" id="ai-local" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Private Local
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Runs a small language model (~1GB) directly in your browser using WebGPU. 100% offline and private — nothing is sent to a server. Requires a one-time download.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>
        </TabsContent>
      </div>
      </Tabs>
    </div>
  );
}

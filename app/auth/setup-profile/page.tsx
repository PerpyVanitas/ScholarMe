"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, Camera, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Specialization {
  id: string
  name: string
}

export default function SetupProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [roleName, setRoleName] = useState<string>("learner")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [membershipNumber, setMembershipNumber] = useState("")
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])

  // Data
  const [specializations, setSpecializations] = useState<Specialization[]>([])

  const isTutor = roleName === "tutor"

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUserId(user.id)

      // Get profile with role
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, roles(*)")
        .eq("id", user.id)
        .single()

      if (profile) {
        setFirstName(profile.first_name || "")
        setLastName(profile.last_name || "")
        setBirthdate(profile.birthdate || "")
        setMembershipNumber(profile.membership_number || "")
        setAvatarUrl(profile.avatar_url || null)
        if (profile.roles?.name) setRoleName(profile.roles.name)

        // If profile already completed, go to dashboard
        if (profile.profile_completed) {
          router.push("/d")
          return
        }
      }

      // Load specializations for tutors
      const { data: specs } = await supabase
        .from("specializations")
        .select("id, name")
        .order("name")
      if (specs) setSpecializations(specs)

      // Load existing tutor specializations
      if (profile?.roles?.name === "tutor") {
        const { data: tutorRow } = await supabase
          .from("tutors")
          .select("id")
          .eq("profile_id", user.id)
          .single()

        if (tutorRow) {
          const { data: tutorSpecs } = await supabase
            .from("tutor_specializations")
            .select("specialization_id")
            .eq("tutor_id", tutorRow.id)
          if (tutorSpecs) {
            setSelectedSpecs(tutorSpecs.map(s => s.specialization_id))
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const filePath = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId)
      toast.success("Photo uploaded!")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function toggleSpec(specId: string) {
    setSelectedSpecs(prev =>
      prev.includes(specId)
        ? prev.filter(id => id !== specId)
        : [...prev, specId]
    )
  }

  async function handleSave() {
    if (!userId) return
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required")
      return
    }

    setSaving(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          birthdate: birthdate || null,
          membership_number: isTutor ? membershipNumber.trim() || null : null,
          profile_completed: true,
        })
        .eq("id", userId)

      if (profileError) throw profileError

      // If tutor, update specializations
      if (isTutor) {
        // Get or create tutor row
        let { data: tutorRow } = await supabase
          .from("tutors")
          .select("id")
          .eq("profile_id", userId)
          .single()

        if (!tutorRow) {
          const { data: newTutor } = await supabase
            .from("tutors")
            .insert({ profile_id: userId })
            .select("id")
            .single()
          tutorRow = newTutor
        }

        if (tutorRow) {
          // Clear old and insert new
          await supabase
            .from("tutor_specializations")
            .delete()
            .eq("tutor_id", tutorRow.id)

          if (selectedSpecs.length > 0) {
            await supabase
              .from("tutor_specializations")
              .insert(
                selectedSpecs.map(specId => ({
                  tutor_id: tutorRow!.id,
                  specialization_id: specId,
                }))
              )
          }
        }
      }

      toast.success("Profile setup complete!")
      window.location.href = "/d"
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">ScholarMe</span>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            {isTutor
              ? "Set up your tutor profile to start accepting sessions"
              : "Tell us a bit about yourself to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt="Profile photo" />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">Click the camera icon to upload a photo</p>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          {/* Birthdate */}
          <div className="space-y-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
            />
          </div>

          {/* Tutor-specific fields */}
          {isTutor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="membershipNumber">Membership Number</Label>
                <Input
                  id="membershipNumber"
                  value={membershipNumber}
                  onChange={e => setMembershipNumber(e.target.value)}
                  placeholder="e.g. TM-2025-001"
                />
              </div>

              <div className="space-y-2">
                <Label>Specializations</Label>
                <p className="text-xs text-muted-foreground">Select the subjects you can tutor</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {specializations.map(spec => {
                    const isSelected = selectedSpecs.includes(spec.id)
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpec(spec.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {spec.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !firstName.trim() || !lastName.trim()}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
      window.location.href = "/d"
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TutorOfTheMonth() {
  return (
    <Card className="border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Medal className="w-24 h-24 text-amber-500" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base text-amber-600 dark:text-amber-500">Tutor of the Month</CardTitle>
        </div>
        <CardDescription>Highest rated tutor this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mt-2">
          <Avatar className="h-16 w-16 border-2 border-amber-500/50">
            <AvatarImage src="https://i.pravatar.cc/150?u=a04258114e29026702d" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg leading-none">John Doe</h3>
            <p className="text-sm text-muted-foreground">Mathematics & Physics</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                5.0 (42 sessions)
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

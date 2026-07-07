"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Minus,
  DollarSign,
  Receipt,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function CashRegisterMode() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"in" | "out">("out");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNumpad = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) throw new Error("Unauthorized");

      // We are creating a budget request that is instantly approved to represent a logged cash transaction
      const { error } = await supabase.from("budget_requests").insert({
        title: description,
        description: `Cash Register Entry: ${category}`,
        amount: type === "out" ? parseFloat(amount) : -parseFloat(amount), // out = positive expense, in = negative expense (income)
        status: "approved",
        submitted_by: user.id,
      });

      if (error) throw error;

      toast.success("Transaction logged successfully!", {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });

      // Reset
      setAmount("");
      setDescription("");
      setCategory("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to log transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-muted/20">
      {/* Left side: Form */}
      <div className="flex-1 p-6 flex flex-col justify-center max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">
            Express Terminal
          </h1>
          <p className="text-muted-foreground mt-2">
            Log in-person cash transactions instantly
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex justify-between items-center">
              <span>New Transaction</span>
              <div className="flex bg-background border rounded-lg overflow-hidden p-1">
                <Button
                  type="button"
                  variant={type === "out" ? "default" : "ghost"}
                  size="sm"
                  className={
                    type === "out" ? "bg-red-500 hover:bg-red-600" : ""
                  }
                  onClick={() => setType("out")}
                >
                  <Minus className="h-4 w-4 mr-2" /> Expense
                </Button>
                <Button
                  type="button"
                  variant={type === "in" ? "default" : "ghost"}
                  size="sm"
                  className={
                    type === "in" ? "bg-green-500 hover:bg-green-600" : ""
                  }
                  onClick={() => setType("in")}
                >
                  <Plus className="h-4 w-4 mr-2" /> Income
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-lg">Amount</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" />
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-20 text-5xl pl-16 font-mono font-bold tracking-tighter"
                    placeholder="0.00"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Pizza for study group"
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Beverage</SelectItem>
                      <SelectItem value="supplies">Office Supplies</SelectItem>
                      <SelectItem value="events">Event Materials</SelectItem>
                      <SelectItem value="transport">Transportation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-16 text-xl font-bold"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : `Log ${type === "out" ? "Expense" : "Income"}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right side: Touch Numpad */}
      <div className="w-[400px] border-l bg-background p-6 flex flex-col justify-center hidden lg:flex">
        <div className="grid grid-cols-3 gap-4 h-[500px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              type="button"
              variant="outline"
              className="h-full text-4xl font-light hover:bg-muted active:scale-95 transition-transform"
              onClick={() => handleNumpad(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-full text-4xl font-light hover:bg-muted active:scale-95 transition-transform"
            onClick={() => handleNumpad(".")}
          >
            .
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-full text-4xl font-light hover:bg-muted active:scale-95 transition-transform"
            onClick={() => handleNumpad("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-full text-2xl font-light active:scale-95 transition-transform"
            onClick={handleBackspace}
          >
            Del
          </Button>
        </div>
      </div>
    </div>
  );
}

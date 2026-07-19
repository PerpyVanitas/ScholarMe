import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface QuizConfigPanelProps {
  quizConfig: Record<
    string,
    { enabled: boolean; count: number; choices?: number }
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setQuizConfig: React.Dispatch<React.SetStateAction<unknown>>;
  generating: boolean;
  creating: boolean;
}

export function QuizConfigPanel({
  quizConfig,
  setQuizConfig,
  generating,
  creating,
}: QuizConfigPanelProps) {
  return (
    <div className="space-y-3 p-4 bg-muted/40 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-semibold">
          Question Types Configuration
        </Label>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Select the types and quantities you want to generate.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(quizConfig).map(([key, config]) => (
          <div
            key={key}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              config.enabled
                ? "border-primary/50 bg-primary/5"
                : "border-border/60 bg-background/50 hover:border-border"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Switch
                id={"quiz_" + key}
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setQuizConfig((prev: unknown) => ({
                    // @ts-ignore: Strict unknown type check
                    ...prev,
                    [key]: {
                      // @ts-ignore: Strict unknown type check
                      ...prev[key],
                      enabled: checked,
                    },
                  }))
                }
                disabled={generating || creating}
                className="scale-90"
              />
              <Label
                htmlFor={"quiz_" + key}
                className="capitalize cursor-pointer text-sm font-medium leading-none"
              >
                {key.replace(/_/g, " ")}
              </Label>
            </div>
            {config.enabled && (
              <Input
                type="number"
                min="1"
                max="50"
                className="w-16 h-8 text-xs font-medium text-center"
                value={config.count}
                onChange={(e) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setQuizConfig((prev: unknown) => ({
                    // @ts-ignore: Strict unknown type check
                    ...prev,
                    [key]: {
                      // @ts-ignore: Strict unknown type check
                      ...prev[key],
                      count: Math.max(1, parseInt(e.target.value) || 1),
                    },
                  }))
                }
                disabled={generating || creating}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

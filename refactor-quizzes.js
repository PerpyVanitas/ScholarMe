const fs = require('fs');

const path = 'app/dashboard/quizzes/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add new state hooks
content = content.replace(
  /const \[selectedResource, setSelectedResource\] = useState\(""\)/,
  `const [selectedResource, setSelectedResource] = useState("")
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [extractingTopics, setExtractingTopics] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])`
);

// 2. Add useEffect for extraction
content = content.replace(
  /useEffect\(\(\) => \{\n    loadStudySets\(\)\n    loadResources\(\)\n  \}, \[\]\)/,
  `useEffect(() => {
    loadStudySets()
    loadResources()
  }, [])

  useEffect(() => {
    async function extractTopics(resourceId: string) {
      setExtractingTopics(true)
      try {
        const res = await fetch("/api/resources/extract-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource_id: resourceId }),
        })
        const data = await res.json()
        if (data.topics) {
          setExtractedTopics(data.topics)
          setSelectedTopics([])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setExtractingTopics(false)
      }
    }
    if (selectedResource) {
      extractTopics(selectedResource)
    } else {
      setExtractedTopics([])
      setSelectedTopics([])
    }
  }, [selectedResource])

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])
  }`
);

// 3. Remove formData.type from state init and update handleCreateQuiz
content = content.replace(
  /type: "mixed" as "multiple_choice" \| "true_false" \| "mixed",/,
  `type: "mixed" as any,`
);

// 4. In handleGenerateFromResource, update targetChapters to use selectedTopics if not empty
content = content.replace(
  /target_chapters: targetChapters,/,
  `target_chapters: selectedTopics.length > 0 ? selectedTopics.join(", ") : targetChapters,`
);

// 5. In handleGenerateQuiz (AI basic), it currently uses formData.type and aiCount. 
// We should build the question_types config here too and pass it!
// BUT /api/quizzes/generate might not support it yet.
// For now, let's just let it use formData.type for backwards compat, we'll derive it from quizConfig.
content = content.replace(
  /const handleGenerateQuiz = async \(\) => \{[\s\S]*?topic: aiPrompt,\s*type: formData\.type,\s*count: aiCount,/,
  `const handleGenerateQuiz = async () => {
    if (!aiPrompt) {
      toast.error("Please enter a topic to generate questions about")
      return
    }

    try {
      setGenerating(true)
      
      const enabledTypes = Object.entries(quizConfig).filter(([_, conf]) => conf.enabled);
      const derivedType = enabledTypes.length === 1 ? enabledTypes[0][0] : "mixed";
      const totalCount = enabledTypes.reduce((acc, [_, conf]) => acc + conf.count, 0) || aiCount;

      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt,
          type: derivedType,
          count: totalCount,`
);

content = content.replace(
  /setFormData\(\{ title: "", description: "", type: "multiple_choice", is_public: false, content: "", source_resource_id: "" \}\)/,
  `setFormData({ title: "", description: "", type: "mixed", is_public: false, content: "", source_resource_id: "" })`
);

// 6. Rewrite the Form UI to extract "Question Types Configuration" out and replace targetChapters with checkboxes
content = content.replace(
  /<div className="grid grid-cols-2 gap-4">[\s\S]*?<Tabs value=\{creationMethod\} onValueChange=\{setCreationMethod\} className="w-full">/,
  `
            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  disabled={creating}
                />
                <span className="text-sm">{formData.is_public ? "Public" : "Private"}</span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-border">
              <Label className="text-sm font-semibold">Question Types Configuration</Label>
              <p className="text-xs text-muted-foreground mb-2">Select types and quantities. Applies to all creation methods.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(quizConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between p-2 border border-border/60 rounded-md bg-zinc-950">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={'quiz_'+key} 
                        checked={config.enabled} 
                        onChange={(e) => setQuizConfig(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof prev], enabled: e.target.checked } }))} 
                        disabled={generating || creating}
                        className="rounded border-zinc-700 bg-zinc-900 w-4 h-4 cursor-pointer"
                      />
                      <Label htmlFor={'quiz_'+key} className="capitalize cursor-pointer text-xs">{key.replace(/_/g, ' ')}</Label>
                    </div>
                    {config.enabled && (
                      <Input 
                        type="number" 
                        min="1" max="50" 
                        className="w-16 h-7 text-xs px-2" 
                        value={config.count}
                        onChange={(e) => setQuizConfig(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof prev], count: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        disabled={generating || creating}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Tabs value={creationMethod} onValueChange={setCreationMethod} className="w-full">`
);

// 7. Remove old Question Types config from Resource tab
content = content.replace(
  /<div className="space-y-3 pt-2 border-t">[\s\S]*?<\/div>[\s\n]*<\/div>[\s\n]*<Button/m,
  `<Button`
);

// 8. Replace targetChapters in Resource tab with checklist
content = content.replace(
  /<div className="grid grid-cols-2 gap-4">[\s\S]*?<Label>Target Chapters\/Topics<\/Label>[\s\S]*?<\/div>[\s\S]*?<div className="space-y-2">[\s\S]*?<Label>Context \/ Instructions<\/Label>[\s\S]*?<\/div>[\s\S]*?<\/div>/m,
  `
                    {extractingTopics ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-zinc-400 bg-zinc-900/30 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scanning document for chapters and topics...
                      </div>
                    ) : extractedTopics.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Select Topics to Include</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border border-border/50 rounded-md bg-zinc-950">
                          {extractedTopics.map(topic => (
                            <div key={topic} className="flex items-start space-x-2">
                              <input 
                                type="checkbox" 
                                id={'topic_'+topic}
                                checked={selectedTopics.includes(topic)}
                                onChange={() => toggleTopic(topic)}
                                className="mt-1 rounded border-zinc-700 bg-zinc-900 w-4 h-4 cursor-pointer shrink-0"
                              />
                              <Label htmlFor={'topic_'+topic} className="text-xs cursor-pointer leading-tight">{topic}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Target Chapters/Topics</Label>
                        <Input 
                          placeholder="e.g. Chapter 3, Photosynthesis (Enter manually)" 
                          value={targetChapters}
                          onChange={e => setTargetChapters(e.target.value)}
                          disabled={generating}
                        />
                      </div>
                    )}
                    <div className="space-y-2 mt-4">
                      <Label>Context / Instructions</Label>
                      <Input 
                        placeholder="e.g. Focus on definitions" 
                        value={userContext}
                        onChange={e => setUserContext(e.target.value)}
                        disabled={generating}
                      />
                    </div>
`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored quizzes/page.tsx");

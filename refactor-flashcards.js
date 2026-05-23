const fs = require('fs');

const path = 'app/dashboard/flashcards/page.tsx';
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

// 3. In handleGenerateFromResource, update targetChapters to use selectedTopics if not empty
content = content.replace(
  /target_chapters: targetChapters,/,
  `target_chapters: selectedTopics.length > 0 ? selectedTopics.join(", ") : targetChapters,`
);

// 4. Update aiCount min input
content = content.replace(
  /const \[aiCount, setAiCount\] = useState\(5\)/,
  `const [aiCount, setAiCount] = useState(5)`
);
content = content.replace(
  /<Input\s*type="number"\s*min="1"\s*max="20"\s*value=\{aiCount\}/,
  `<Input
                    type="number"
                    min="1"
                    max="50"
                    value={aiCount}`
);

// 5. Replace targetChapters in Resource tab with checklist
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
console.log("Refactored flashcards/page.tsx");

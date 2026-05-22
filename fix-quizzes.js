const fs = require('fs');

const pathQ = 'app/dashboard/quizzes/page.tsx';
let qContent = fs.readFileSync(pathQ, 'utf8');

// The replacement in quizzes/page.tsx destroyed loadResources and loadStudySets.
// Let's find the `fetch("/api/quizzes/my-sets")` and reconstruct above it.

qContent = qContent.replace(
  /fetch\("\/api\/quizzes\/my-sets"\),\s*fetch\("\/api\/quizzes\/shared"\)\s*\]\)/m,
  `const loadResources = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("resources").select("id, title").order("created_at", { ascending: false })
    if (data) setResources(data)
  }

  useEffect(() => {
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
  }

  const loadStudySets = async () => {
    try {
      setLoading(true)
      const [myRes, sharedRes] = await Promise.all([
        fetch("/api/quizzes/my-sets"),
        fetch("/api/quizzes/shared")
      ])`
);

fs.writeFileSync(pathQ, qContent, 'utf8');
console.log("Fixed quizzes/page.tsx");

// Now let's fix flashcards/page.tsx
const pathF = 'app/dashboard/flashcards/page.tsx';
let fContent = fs.readFileSync(pathF, 'utf8');

// Here loadResources and loadStudySets are still intact.
// We just need to inject the effect and toggleTopic below useEffect(..., [])

fContent = fContent.replace(
  /useEffect\(\(\) => \{\s*loadStudySets\(\)\s*loadResources\(\)\s*\}, \[\]\)/m,
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

fs.writeFileSync(pathF, fContent, 'utf8');
console.log("Fixed flashcards/page.tsx");

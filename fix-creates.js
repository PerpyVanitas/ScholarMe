const fs = require('fs');

const quizzesPath = 'app/dashboard/quizzes/page.tsx';
let qContent = fs.readFileSync(quizzesPath, 'utf8');

qContent = qContent.replace(
  /}\),\s*}\)\s*\} catch \(error\) \{/m,
  `}),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create study set")
      }

      toast.success("Study set created!")
      
      // Earn XP
      const { earnXp } = await import("@/lib/utils/gamification")
      const xpData = await earnXp(25, "Created Quiz")
      if (xpData.success) {
        toast.success(\`🎉 +25 XP Earned!\`, {
          description: xpData.current_level ? \`You are now Level \${xpData.current_level}\` : "Keep building your knowledge base!",
        })
      }

      setFormData({ title: "", description: "", type: "mixed", is_public: false, content: "", source_resource_id: "" })
      setStructuredItems([])
      setUserContext("")
      setTargetChapters("")
      setDialogOpen(false)
      await loadStudySets()
    } catch (error) {`
);

fs.writeFileSync(quizzesPath, qContent, 'utf8');
console.log("Fixed quizzes create");

const flashcardsPath = 'app/dashboard/flashcards/page.tsx';
let fContent = fs.readFileSync(flashcardsPath, 'utf8');

fContent = fContent.replace(
  /if \(!res\.ok\) \{\s*const errorData = await res\.json\(\)\s*throw new Error\(errorData\.error \|\| "Failed to create study set"\)\s*\}\s*toast\.success\("Study set created!"\)\s*setFormData\(\{ title: "", description: "", type: "flashcard", is_public: false, content: "", source_resource_id: "" \}\)\s*setStructuredItems\(\[\]\)\s*setUserContext\(""\)\s*setTargetChapters\(""\)\s*setDialogOpen\(false\)\s*await loadStudySets\(\)/m,
  `if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create study set")
      }

      toast.success("Study set created!")

      // Earn XP
      const { earnXp } = await import("@/lib/utils/gamification")
      const xpData = await earnXp(25, "Created Flashcards")
      if (xpData.success) {
        toast.success(\`🎉 +25 XP Earned!\`, {
          description: xpData.current_level ? \`You are now Level \${xpData.current_level}\` : "Keep building your knowledge base!",
        })
      }

      setFormData({ title: "", description: "", type: "flashcard", is_public: false, content: "", source_resource_id: "" })
      setStructuredItems([])
      setUserContext("")
      setTargetChapters("")
      setDialogOpen(false)
      await loadStudySets()`
);

fs.writeFileSync(flashcardsPath, fContent, 'utf8');
console.log("Fixed flashcards create");

"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  Loader2,
  Trophy,
  Clock,
  BookOpen,
  Shuffle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface StudySetItem {
  id: string
  question: string
  answer: string
  options: string[] | null
  item_type: "flashcard" | "multiple_choice" | "true_false"
  order_index: number
}

interface StudySet {
  id: string
  title: string
  description: string | null
  type: string
  study_set_items: StudySetItem[]
  profiles?: { full_name: string }
}

export default function StudyModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean }>>({})
  const [studyMode, setStudyMode] = useState<"flashcard" | "quiz">("flashcard")
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [shuffledItems, setShuffledItems] = useState<StudySetItem[]>([])

  useEffect(() => {
    loadStudySet()
  }, [id])

  async function loadStudySet() {
    try {
      const res = await fetch(`/api/quizzes/${id}`)
      if (!res.ok) {
        throw new Error("Failed to load study set")
      }
      const data = await res.json()
      setStudySet(data.data)
      
      // Sort items by order_index
      const items = data.data.study_set_items?.sort((a: StudySetItem, b: StudySetItem) => 
        a.order_index - b.order_index
      ) || []
      setShuffledItems(items)
    } catch (error) {
      toast.error("Failed to load study set")
      router.push("/dashboard/quizzes")
    } finally {
      setLoading(false)
    }
  }

  function shuffleItems() {
    const shuffled = [...shuffledItems].sort(() => Math.random() - 0.5)
    setShuffledItems(shuffled)
    setCurrentIndex(0)
    setAnswers({})
    setShowAnswer(false)
    setSelectedAnswer("")
    setIsComplete(false)
    toast.success("Cards shuffled!")
  }

  function handleNext() {
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
      setSelectedAnswer("")
    } else {
      setIsComplete(true)
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
      setSelectedAnswer("")
    }
  }

  function handleFlip() {
    setShowAnswer(!showAnswer)
  }

  function handleAnswerSelect(answer: string) {
    setSelectedAnswer(answer)
    const currentItem = shuffledItems[currentIndex]
    const isCorrect = answer.toLowerCase() === currentItem.answer.toLowerCase()
    
    setAnswers({
      ...answers,
      [currentItem.id]: { answer, correct: isCorrect }
    })
    
    setShowAnswer(true)
  }

  function handleRestart() {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSelectedAnswer("")
    setAnswers({})
    setIsComplete(false)
  }

  async function saveAttempt() {
    const correctCount = Object.values(answers).filter(a => a.correct).length
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    try {
      await fetch("/api/quizzes/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_set_id: id,
          score: correctCount,
          total_questions: shuffledItems.length,
          answers: Object.fromEntries(
            Object.entries(answers).map(([k, v]) => [k, v.answer])
          ),
          time_spent_seconds: timeSpent,
        }),
      })
    } catch (error) {
      console.error("Failed to save attempt:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!studySet || shuffledItems.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="py-12">
          <CardContent className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items to study</h3>
            <p className="text-muted-foreground mb-4">
              This study set has no questions yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/quizzes">Back to Quizzes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentItem = shuffledItems[currentIndex]
  const progress = ((currentIndex + 1) / shuffledItems.length) * 100
  const correctCount = Object.values(answers).filter(a => a.correct).length

  // Results screen
  if (isComplete) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(timeSpent / 60)
    const seconds = timeSpent % 60
    const percentage = Math.round((correctCount / shuffledItems.length) * 100)

    // Save attempt
    saveAttempt()

    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl">Study Session Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{percentage}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{correctCount}/{shuffledItems.length}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{minutes}:{seconds.toString().padStart(2, '0')}</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Study Again
              </Button>
              <Button asChild>
                <Link href="/dashboard/quizzes">
                  Back to Quizzes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard/quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{studySet.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={shuffleItems}>
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
          <Badge variant="secondary">
            {currentIndex + 1} / {shuffledItems.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6 h-2" />

      {/* Study Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={studyMode === "flashcard" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStudyMode("flashcard")}
        >
          Flashcard Mode
        </Button>
        <Button 
          variant={studyMode === "quiz" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStudyMode("quiz")}
        >
          Quiz Mode
        </Button>
      </div>

      {/* Card */}
      <Card className="min-h-[300px] mb-6">
        <CardContent className="p-8">
          {studyMode === "flashcard" ? (
            // Flashcard Mode
            <div 
              className="cursor-pointer min-h-[220px] flex flex-col items-center justify-center text-center"
              onClick={handleFlip}
            >
              {!showAnswer ? (
                <>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Question</p>
                  <p className="text-xl font-medium">{currentItem.question}</p>
                  <p className="text-sm text-muted-foreground mt-6">Click to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Answer</p>
                  <p className="text-xl font-medium text-primary">{currentItem.answer}</p>
                  <p className="text-sm text-muted-foreground mt-6">Click to see question</p>
                </>
              )}
            </div>
          ) : (
            // Quiz Mode
            <div className="min-h-[220px]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Question</p>
              <p className="text-xl font-medium mb-6">{currentItem.question}</p>
              
              {currentItem.item_type === "true_false" ? (
                <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={showAnswer}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                    {showAnswer && currentItem.answer.toLowerCase() === "true" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                    {showAnswer && currentItem.answer.toLowerCase() === "false" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </RadioGroup>
              ) : currentItem.options && currentItem.options.length > 0 ? (
                <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={showAnswer}>
                  {currentItem.options.map((option, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 ${
                        showAnswer && option === currentItem.answer ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                      } ${
                        showAnswer && selectedAnswer === option && option !== currentItem.answer ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                      {showAnswer && option === currentItem.answer && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {showAnswer && selectedAnswer === option && option !== currentItem.answer && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                // Free text - show answer on click
                <div>
                  {!showAnswer ? (
                    <Button onClick={() => setShowAnswer(true)} variant="outline" className="w-full">
                      Show Answer
                    </Button>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                      <p className="font-medium text-primary">{currentItem.answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{Math.floor((Date.now() - startTime) / 60000)}:{((Date.now() - startTime) / 1000 % 60).toFixed(0).padStart(2, '0')}</span>
        </div>

        <Button onClick={handleNext}>
          {currentIndex === shuffledItems.length - 1 ? "Finish" : "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

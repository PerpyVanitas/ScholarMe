import { useState, useEffect } from "react";
import { CreateWebWorkerMLCEngine, InitProgressReport, hasModelInCache, MLCEngineInterface } from "@mlc-ai/web-llm";

export type AIProvider = "webgpu" | "server" | "none";

interface UseWebLLMOptions {
  model?: string;
  workerUrl?: URL;
}

/**
 * A custom hook that abstracts WebLLM initialization.
 * It checks if navigator.gpu is supported. If not, it returns a mocked engine
 * that forwards requests to the server-side API fallback.
 */
export function useWebLLM({
  model = "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  workerUrl
}: UseWebLLMOptions = {}) {
  const [engine, setEngine] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initProgress, setInitProgress] = useState<InitProgressReport | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("none");

  // Determine which worker URL to use (defaulting to the one in lib/workers)
  const workerToUse = workerUrl || (typeof window !== "undefined" ? new URL("../lib/workers/webllm.worker.ts", import.meta.url) : undefined);

  useEffect(() => {
    const checkCache = async () => {
      try {
        if (!navigator.gpu) return; // Only check cache if GPU is available
        const isCached = await hasModelInCache(model);
        if (isCached) {
          initializeEngine();
        }
      } catch (error) {
        console.error("Failed to check cache:", error);
      }
    };
    checkCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  async function initializeEngine() {
    if (engine || isLoading) return;
    setIsLoading(true);

    // 1. Device Capability Check
    if (!navigator.gpu) {
      console.warn("WebGPU not supported on this device/browser. Falling back to server-side AI.");
      setProvider("server");
      
      // Create a mock engine interface that maps to our server route
      const mockEngine = {
        chat: {
          completions: {
            create: async (request: any) => {
              const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: request.messages })
              });
              
              if (!response.ok) {
                throw new Error("Server-side AI request failed");
              }
              
              return await response.json();
            }
          }
        }
      };
      
      setEngine(mockEngine);
      setInitProgress({ progress: 1, text: "Ready (Server Fallback)", timeElapsed: 0 });
      setIsReady(true);
      setIsLoading(false);
      return mockEngine;
    }

    // 2. WebGPU Available - Initialize Local ML Engine
    try {
      setProvider("webgpu");
      if (!workerToUse) throw new Error("Worker URL not provided");
      
      const newEngine = await CreateWebWorkerMLCEngine(
        new Worker(workerToUse, { type: "module" }),
        model,
        {
          initProgressCallback: (progress) => {
            setInitProgress(progress);
          },
        }
      );
      setEngine(newEngine);
      setIsReady(true);
      return newEngine;
    } catch (error) {
      console.error("Failed to initialize WebLLM engine, falling back to server:", error);
      
      // Fallback on initialization error
      setProvider("server");
      const mockEngine = {
        chat: {
          completions: {
            create: async (request: any) => {
              const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: request.messages })
              });
              if (!response.ok) throw new Error("Server-side AI request failed");
              return await response.json();
            }
          }
        }
      };
      setEngine(mockEngine);
      setIsReady(true);
      return mockEngine;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    engine,
    isLoading,
    isReady,
    initProgress,
    provider,
    initializeEngine
  };
}

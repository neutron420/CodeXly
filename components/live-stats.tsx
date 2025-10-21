'use client'

import { useInterval } from "@/hooks/use-interval"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { Play, Pause, Timer, RotateCw } from "lucide-react"

// Renamed function from UseIntervalDemo to LiveStats
export function LiveStats() {
  const [count, setCount] = useState<number>(0)
  const [delay, setDelay] = useState<number>(1000)
  const [isPlaying, setPlaying] = useState<boolean>(false)

  useInterval(
    () => {
      setCount(count + 1)
    },
    isPlaying ? delay : null
  )

  return (
    // Rest of the component code remains the same...
    <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Left Column - Interactive Demo */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Interval Counter</h3>
            <p className="text-sm text-muted-foreground">
              A counter that increments based on the interval
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Counter Display */}
            <div className="text-6xl font-bold tabular-nums">
              {count}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCount(0)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>Interval Delay:</span>
              </div>
              <span className="font-mono">{delay}ms</span>
            </div>

            <Slider
              value={[delay]}
              onValueChange={([newDelay]) => setDelay(newDelay)}
              min={100}
              max={2000}
              step={100}
              className="py-4"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            Status: {isPlaying ? (
              <span className="text-green-500">Running</span>
            ) : (
              <span className="text-yellow-500">Paused</span>
            )}
          </div>
        </div>
      </Card>

      {/* Right Column - Documentation */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">About useInterval</h3>
            <p className="text-sm text-muted-foreground">
              A declarative interval hook that can be paused and resumed.
            </p>
          </div>

          <div className="space-y-4">
            <pre className="bg-muted p-3 rounded-md text-xs">
{`const [count, setCount] = useState(0)
const [delay, setDelay] = useState(1000)
const [isPlaying, setPlaying] = useState(false)

useInterval(
  () => {
    setCount(count + 1)
  },
  isPlaying ? delay : null
)`}
            </pre>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Features</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Memory leak safe</li>
                  <li>Supports dynamic delays</li>
                  <li>Pause/resume functionality</li>
                  <li>TypeScript ready</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Common Use Cases</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Polling APIs</li>
                  <li>Countdown timers</li>
                  <li>Game loops</li>
                  <li>Animations</li>
                </ul>
              </div>

              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Pro Tip:</p>
                Pass <code className="text-xs">null</code> as delay to pause the interval
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
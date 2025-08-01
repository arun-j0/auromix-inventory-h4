"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface DashboardChartProps {
  data: any[]
  type: "bar" | "line" | "pie" | "doughnut"
  height?: number
}

export function DashboardChart({ data, type, height = 300 }: DashboardChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Create chart configuration based on type
    const chartConfig: any = {
      type,
      data: {
        labels: data.map((item) => item.label),
        datasets: [
          {
            data: data.map((item) => item.value),
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(249, 115, 22, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(139, 92, 246, 0.7)",
              "rgba(236, 72, 153, 0.7)",
            ],
            borderColor: [
              "rgba(59, 130, 246, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(239, 68, 68, 1)",
              "rgba(139, 92, 246, 1)",
              "rgba(236, 72, 153, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: type === "pie" || type === "doughnut" ? "right" : "top",
          },
        },
      },
    }

    // Create chart instance
    chartInstance.current = new Chart(ctx, chartConfig)

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, type])

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={chartRef} />
    </div>
  )
}

import { useEffect, useRef } from 'react'

interface RankingData {
  studentId: string
  studentName: string
  score: number
  rank: number
}

interface RankingChartProps {
  data: RankingData[]
  type?: 'bar' | 'line' | 'pie'
  title?: string
}

export default function RankingChart({ data, type = 'bar', title }: RankingChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      // TODO: Implement Chart.js visualization
      console.log('Rendering chart:', type, data)
      // Example: Use Chart.js library to render chart
      // const ctx = chartRef.current.getContext('2d')
      // new Chart(ctx, { type, data: ... })
    }
  }, [data, type])

  return (
    <div className="ranking-chart-component">
      {title && <h3 className="chart-title">{title}</h3>}
      
      <div className="chart-container">
        <canvas ref={chartRef} />
        
        {data.length === 0 && (
          <div className="no-chart-data">Chưa có dữ liệu xếp hạng</div>
        )}
      </div>

      {data.length > 0 && (
        <div className="ranking-table">
          <table>
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Sinh viên</th>
                <th>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.studentId}>
                  <td className="rank-cell">#{item.rank}</td>
                  <td>{item.studentName}</td>
                  <td className="score-cell">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

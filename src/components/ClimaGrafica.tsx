import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";

// Registrar componentes que usa la gráfica
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

export default function ClimaGrafica({ clima }) {
  if (!clima) return null;

  // Usar primeras 24 horas (puedes ajustar)
  const labels = clima.hourly.time.slice(0, 24).map(t => t.slice(11, 16)); // Hora:Minuto
  const temp = clima.hourly.temperature_2m.slice(0, 24);
  const lluvia = clima.hourly.precipitation.slice(0, 24);

  return (
    <div className="bg-slate-900 rounded-xl p-3 w-full h-64">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Temperatura (°C)",
              data: temp,
              yAxisID: "y1",
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: "Lluvia (mm)",
              data: lluvia,
              yAxisID: "y2",
              borderDash: [5, 5],
              borderWidth: 2,
            }
          ]
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            y1: {
              type: "linear",
              position: "left",
              title: { display: true, text: "°C" }
            },
            y2: {
              type: "linear",
              position: "right",
              title: { display: true, text: "mm" },
              grid: { drawOnChartArea: false }
            }
          }
        }}
      />
    </div>
  );
}

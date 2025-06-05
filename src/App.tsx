import { useState, useEffect } from "react";
import PoligonoMapa from "./components/PoligonoMapa";
import ClimaGrafica from "./components/ClimaGrafica";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLoader, FiHelpCircle } from "react-icons/fi";
import * as Tooltip from '@radix-ui/react-tooltip';

/* ... FASES, recomendacionesPreSiembra, recomendacionesPorFase ... (igual que antes, omítelos para ahorrar espacio aquí; usa los tuyos ya validados) ... */

const FASES = { /* ... igual ... */ };
function recomendacionesPreSiembra(cultivo: string) { /* ... igual ... */ }
function recomendacionesPorFase(cultivo: string, dias: number, clima: any) { /* ... igual ... */ }

export default function App() {
  const [coords, setCoords] = useState<number[][] | null>(null);
  const [cultivo, setCultivo] = useState("Maíz");
  const [yaSembro, setYaSembro] = useState<null | boolean>(null);
  const [fecha, setFecha] = useState("");
  const [clima, setClima] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [centro, setCentro] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [nombreLugar, setNombreLugar] = useState<string | null>(null);

  // Leyendas para cada paso
  const leyendas: Record<number, string> = {
    1: "Dibuja sobre el mapa el área de tu terreno o parcela. Puedes acercar, mover el mapa y marcar los puntos de tu polígono.",
    2: "Selecciona el cultivo y responde si ya sembraste. Si no, verás recomendaciones para prepararte.",
    3: "Aquí verás el manejo sugerido, clima actual y recomendaciones según el día de tu cultivo."
  };

  // Persistencia
  useEffect(() => {
    const saved = localStorage.getItem("agro-info-state");
    if (saved) {
      const s = JSON.parse(saved);
      setCultivo(s.cultivo || "Maíz");
      setFecha(s.fecha || "");
      setCoords(s.coords || null);
      setYaSembro(s.yaSembro ?? null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "agro-info-state",
      JSON.stringify({ cultivo, fecha, coords, yaSembro })
    );
  }, [cultivo, fecha, coords, yaSembro]);

  // Calcula centro polígono
  function centroPoligono(pol: number[][]) {
    let lat = 0, lng = 0;
    for (const [la, ln] of pol) { lat += la; lng += ln; }
    return [lat / pol.length, lng / pol.length];
  }

  // Busca nombre del lugar usando reverse geocoding (OpenStreetMap/Nominatim)
  async function fetchNombreLugar(centro: [number, number]) {
    setNombreLugar(null);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${centro[0]}&lon=${centro[1]}&zoom=10&accept-language=es`;
      const { data } = await axios.get(url);
      setNombreLugar(data.display_name || null);
    } catch {
      setNombreLugar(null);
    }
  }

  // Cada vez que cambia el centro, busca el nombre del lugar
  useEffect(() => {
    if (centro) fetchNombreLugar(centro);
  }, [centro]);

  const hoy = new Date();
  const fechaSiembraDate = fecha ? new Date(fecha) : null;
  const dias = fechaSiembraDate
    ? Math.floor((hoy.getTime() - fechaSiembraDate.getTime()) / 864e5)
    : 0;
  const fechaInvalida = fechaSiembraDate && fechaSiembraDate > hoy;

  // Fallback seguro para fases
  const fasesCultivo = FASES[cultivo] || [];
  const totalDias = fasesCultivo.length > 0
    ? fasesCultivo[fasesCultivo.length - 1].diasMax
    : 100;

  const avance = Math.min(100, Math.round((dias / totalDias) * 100));
  const diasRestantes = Math.max(0, totalDias - dias);
  const fechaCosechaEst = fechaSiembraDate
    ? new Date(fechaSiembraDate.getTime() + totalDias * 864e5).toLocaleDateString()
    : "";

  const faseInfo =
    yaSembro && fecha && !fechaInvalida
      ? recomendacionesPorFase(cultivo, dias, clima)
      : null;

  async function consultarClima() {
    if (!coords) return;
    setLoading(true);
    const [lat, lng] = centroPoligono(coords);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation&forecast_days=3&timezone=America/Guatemala`;
      const { data } = await axios.get(url);
      setClima(data);
      setStep(3);
    } catch (err) {
      toast.error("Error consultando clima. Revisa tu conexión.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setCoords(null);
    setYaSembro(null);
    setFecha("");
    setClima(null);
    setStep(1);
    localStorage.clear();
  }

  // Componente de leyenda emergente con Radix UI Tooltip
  const LeyendaTooltip = ({ paso }: { paso: number }) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button className="ml-2 text-teal-400 hover:text-teal-200 focus:outline-none" aria-label="Ayuda">
          <FiHelpCircle className="inline align-middle text-xl" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="bg-slate-700 text-white p-4 rounded-xl shadow-lg max-w-xs text-base z-50" side="right" sideOffset={10}>
          <span>{leyendas[paso]}</span>
          <Tooltip.Arrow className="fill-slate-700" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );

  // --- RENDER ---
  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col font-sans">
      <ToastContainer position="top-center" autoClose={4000} theme="dark" />

      <header className="bg-slate-800 py-5 px-4 flex items-center gap-4 shadow-md w-full">
        <span className="text-3xl">🌽</span>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wider text-white">
          Agro-Info GT
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-0 sm:px-2 py-4 w-full">
        <div className="w-full max-w-xl flex flex-col gap-7 md:gap-10">
          {/* Paso 1: Mapa */}
          {step === 1 && (
            <section className="bg-slate-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-8 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl">1</span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white break-words">
                  Dibuja el cultivo
                </h2>
                <LeyendaTooltip paso={1} />
              </div>
              <div className="w-full h-40 sm:h-48 md:h-64 rounded-xl overflow-hidden">
                <PoligonoMapa onPolygonCreated={(coords) => {
                  setCoords(coords);
                  setCentro(centroPoligono(coords));
                }} />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl px-6 py-2 text-lg transition disabled:opacity-50"
                  disabled={!coords}
                  onClick={() => setStep(2)}
                >
                  Siguiente
                </button>
              </div>
            </section>
          )}

          {/* Paso 2: Ya sembró? */}
          {step === 2 && yaSembro === null && (
            <section className="bg-slate-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-8 w-full flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl">2</span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white break-words">
                  ¿Ya sembraste este cultivo?
                </h2>
                <LeyendaTooltip paso={2} />
              </div>
              <select
                className="bg-slate-700 rounded-xl px-3 py-3 text-base sm:text-lg md:text-xl text-white outline-none focus:ring-2 focus:ring-teal-600 w-full mb-3"
                value={cultivo}
                onChange={e => setCultivo(e.target.value)}
              >
                <option>Maíz</option>
                <option>Papa</option>
                <option>Frijol</option>
                <option>Trigo</option>
              </select>
              <div className="flex gap-4">
                <button
                  className="w-1/2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl py-3 text-lg transition"
                  onClick={() => setYaSembro(true)}
                >Sí, ya sembré</button>
                <button
                  className="w-1/2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl py-3 text-lg transition"
                  onClick={() => setYaSembro(false)}
                >No, aún no sembré</button>
              </div>
              <div className="flex justify-start mt-3">
                <button
                  className="bg-slate-700 hover:bg-slate-500 text-white rounded-xl px-4 py-2 text-base"
                  onClick={() => setStep(1)}
                >
                  Volver
                </button>
              </div>
            </section>
          )}

          {/* Paso 2: Fecha de siembra */}
          {step === 2 && yaSembro === true && (
            <section className="bg-slate-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-8 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl">2</span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white break-words">
                  Fecha de siembra
                </h2>
                <LeyendaTooltip paso={2} />
              </div>
              <input
                type="date"
                className="bg-slate-700 rounded-xl px-3 py-3 text-base sm:text-lg md:text-xl text-white outline-none focus:ring-2 focus:ring-teal-600 w-full mb-2"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                placeholder="Fecha de siembra"
              />
              <button
                className="w-full mt-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl py-4 text-lg sm:text-xl md:text-2xl transition disabled:opacity-50"
                onClick={consultarClima}
                disabled={!coords || !fecha}
              >
                Analizar
              </button>
              <div className="flex justify-start mt-3">
                <button
                  className="bg-slate-700 hover:bg-slate-500 text-white rounded-xl px-4 py-2 text-base"
                  onClick={() => setYaSembro(null)}
                >
                  Volver
                </button>
              </div>
            </section>
          )}

          {/* Paso 2: Pre-siembra */}
          {step === 2 && yaSembro === false && (
            <section className="bg-slate-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-8 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl">2</span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white break-words">
                  Recomendaciones antes de sembrar
                </h2>
                <LeyendaTooltip paso={2} />
              </div>
              <ul className="list-disc pl-4 text-gray-300 text-base sm:text-lg md:text-xl space-y-1 w-full break-words whitespace-normal">
                {recomendacionesPreSiembra(cultivo).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
              <div className="flex justify-start mt-3">
                <button
                  className="bg-slate-700 hover:bg-slate-500 text-white rounded-xl px-4 py-2 text-base"
                  onClick={() => setYaSembro(null)}
                >
                  Volver
                </button>
              </div>
            </section>
          )}

          {/* Paso 3: Manejo y clima */}
          {step === 3 && (
            <section className="bg-slate-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-8 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl">3</span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white break-words">
                  Manejo y clima actual
                </h2>
                <LeyendaTooltip paso={3} />
              </div>
              <div className="mb-3 text-teal-200">
                <div>Cultivo: <b>{cultivo}</b></div>
                <div>Fecha de siembra: <b>{fecha}</b></div>
                {fechaInvalida ? (
                  <div className="mt-2 text-yellow-400 font-bold">
                    La fecha seleccionada es posterior a hoy.<br />
                    Elige una fecha válida.
                  </div>
                ) : (
                  <>
                    <div>
                      Fase actual: <b>{faseInfo?.fase}</b>{" "}
                      <span className="text-xs">(día {dias})</span>
                    </div>
                    {faseInfo?.esCosecha && (
                      <div className="mt-2 text-yellow-400 font-bold">
                        ¡Ya deberías cosechar!
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Spinner */}
              {loading && (
                <div className="flex items-center justify-center my-4">
                  <FiLoader className="animate-spin text-teal-400 text-3xl" />
                  <span className="ml-2 text-teal-200">Consultando clima…</span>
                </div>
              )}

              {/* Clima */}
              {!loading && (
                <div>
                  {clima ? (
                    <>
                      <div className="mb-2">
                        <span className="text-white font-bold">Temperatura:</span>
                        <span className="ml-2 text-teal-300">
                          {clima.hourly.temperature_2m[0]} °C
                        </span>
                      </div>
                      <div>
                        <span className="text-white font-bold">Lluvia (mm):</span>
                        <span className="ml-2 text-teal-300">
                          {clima.hourly.precipitation[0]}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-red-400">No hay datos climáticos</span>
                  )}
                </div>
              )}

              {/* Avance y estimación */}
              {!fechaInvalida && (
                <div className="mt-4">
                  <span className="text-white font-bold">Avance del ciclo:</span>
                  <div className="w-full bg-slate-700 rounded h-4 mt-1">
                    <div
                      style={{ width: `${avance}%` }}
                      className="h-4 rounded bg-teal-500"
                    />
                  </div>
                  <p className="text-teal-300 text-sm mt-1">
                    {avance}% completado • cosecha estimada: {fechaCosechaEst}
                  </p>
                </div>
              )}

              {/* Ubicación con nombre */}
              <div className="bg-slate-900 rounded-xl p-4 h-28 sm:h-36 flex-1 flex flex-col justify-center items-center min-w-0 my-2">
                <span className="text-teal-200 mb-2 text-xs sm:text-base md:text-lg break-words text-center">
                  Ubicación central consultada
                </span>
                <div className="text-gray-300 text-center">
                  {nombreLugar
                    ? <span className="text-base sm:text-lg md:text-xl font-bold">{nombreLugar}</span>
                    : centro
                      ? <>
                          <span className="text-base sm:text-lg md:text-xl font-bold">
                            Lat: {centro[0].toFixed(5)}
                          </span>
                          <br />
                          <span className="text-base sm:text-lg md:text-xl font-bold">
                            Lng: {centro[1].toFixed(5)}
                          </span>
                        </>
                      : <span className="text-xs">Dibuja un polígono para ver la ubicación</span>}
                </div>
              </div>

              {/* Gráfica */}
              {clima && <ClimaGrafica clima={clima} />}

              {/* Recomendaciones */}
              {!fechaInvalida && (
                <div className="bg-slate-900 rounded-xl p-4 mt-3">
                  <span className="text-teal-200 mb-2 text-sm block text-center">
                    Recomendaciones {faseInfo?.esCosecha ? "de cosecha" : "de manejo"}
                  </span>
                  <ul className="list-disc pl-4 text-gray-300 text-base space-y-1">
                    {faseInfo?.recomendaciones.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-start mt-4">
                <button
                  className="bg-slate-600 hover:bg-slate-500 text-white rounded-xl px-4 py-2 text-base"
                  onClick={() => {
                    setStep(2);
                    setYaSembro(null);
                  }}
                >
                  Volver
                </button>
                <button
                  onClick={resetAll}
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 text-base ml-3"
                >
                  Resetear flujo
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

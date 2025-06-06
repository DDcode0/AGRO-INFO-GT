import { useState, useEffect } from "react";
import PoligonoMapa from "./components/PoligonoMapa";
import ClimaGrafica from "./components/ClimaGrafica";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLoader } from "react-icons/fi";

/* FASES: Completo y seguro */
const FASES: Record<string, any[]> = {
  "Maíz": [
    { diasMin: 0, diasMax: 15, fase: "Emergencia", recs: [
      "Mantén humedad constante para favorecer la emergencia.",
      "Evita encharcamientos.",
      "Monitorea aparición de plántulas y controla malezas iniciales."
    ]},
    { diasMin: 16, diasMax: 30, fase: "Desarrollo vegetativo (V4)", recs: [
      "Aplica fertilizante nitrogenado.",
      "Mantén el campo libre de malezas.",
      "Revisa el estado de las raíces y primer monitoreo de plagas."
    ]},
    { diasMin: 31, diasMax: 55, fase: "Floración", recs: [
      "Evita estrés hídrico: riega si no hay lluvia.",
      "No apliques fertilizante en esta etapa.",
      "Revisa presencia de gusano cogollero y otras plagas."
    ]},
    { diasMin: 56, diasMax: 90, fase: "Llenado/Grano", recs: [
      "Mantén humedad adecuada, pero no encharques.",
      "Prepara maquinaria para la cosecha.",
      "Monitorea aparición de enfermedades fúngicas (hongos)."
    ]},
    { diasMin: 91, diasMax: 200, fase: "Cosecha", recs: [
      "Cosecha cuando los granos estén duros y secos.",
      "Evita riego, prioriza secado.",
      "No demores cosecha para evitar pérdidas por clima."
    ], esCosecha: true }
  ],
  "Papa": [
    { diasMin: 0, diasMax: 20, fase: "Siembra-Emergencia", recs: [
      "Evita encharcamientos y suelos compactados.",
      "Aplica fertilizante al inicio del ciclo.",
      "Controla primeras malezas manualmente."
    ]},
    { diasMin: 21, diasMax: 45, fase: "Desarrollo vegetativo", recs: [
      "Aplica abono potásico.",
      "Mantén la humedad constante.",
      "Monitorea aparición de insectos y enfermedades."
    ]},
    { diasMin: 46, diasMax: 70, fase: "Floración", recs: [
      "Aumenta vigilancia de tizón tardío (hongos).",
      "Evita riegos excesivos.",
      "Fertiliza si el follaje es débil."
    ]},
    { diasMin: 71, diasMax: 100, fase: "Maduración", recs: [
      "Reduce riego poco a poco.",
      "Monitorea maduración del follaje.",
      "Evita daño mecánico si cosechas."
    ]},
    { diasMin: 101, diasMax: 200, fase: "Cosecha", recs: [
      "Cosecha cuando el follaje está seco o amarillo.",
      "No riegues más, deja secar el terreno.",
      "Evita cosechar en suelos muy húmedos."
    ], esCosecha: true }
  ],
  "Frijol": [
    { diasMin: 0, diasMax: 10, fase: "Emergencia", recs: [
      "Mantén la tierra suelta, sin costra.",
      "Evita riego excesivo y encharcamientos.",
      "Aplica insecticida si hay daño de trips."
    ]},
    { diasMin: 11, diasMax: 25, fase: "Vegetativo", recs: [
      "Fertiliza si lo requiere.",
      "Realiza deshierbes frecuentes.",
      "Monitorea aparición de áfidos y mosca blanca."
    ]},
    { diasMin: 26, diasMax: 40, fase: "Floración", recs: [
      "No riegues en exceso.",
      "Evita aplicaciones foliares innecesarias.",
      "Controla plagas: trips, gusano bellotero."
    ]},
    { diasMin: 41, diasMax: 60, fase: "Llenado de vainas", recs: [
      "Mantén humedad, evita exceso de nitrógeno.",
      "Monitorea llenado y aparición de hongos."
    ]},
    { diasMin: 61, diasMax: 200, fase: "Cosecha", recs: [
      "Cosecha cuando el 80% de las vainas estén maduras.",
      "Evita lluvias en cosecha, riesgo de desgrane.",
      "No fertilices más ni riegues."
    ], esCosecha: true }
  ],
  "Trigo": [
    { diasMin: 0, diasMax: 14, fase: "Emergencia", recs: [
      "Riego ligero para facilitar emergencia.",
      "Evita costras y monitorea malezas."
    ]},
    { diasMin: 15, diasMax: 28, fase: "Macollamiento", recs: [
      "Aplica nitrógeno y controla malezas.",
      "Riega solo si es necesario."
    ]},
    { diasMin: 29, diasMax: 50, fase: "Espigado", recs: [
      "No realices aplicaciones de productos que puedan dañar la flor.",
      "Vigila roya y otros hongos.",
      "Evita sequía."
    ]},
    { diasMin: 51, diasMax: 90, fase: "Maduración", recs: [
      "Reduce riegos, prepara para cosecha.",
      "No fertilices.",
      "Limpia maquinaria antes de cosechar."
    ]},
    { diasMin: 91, diasMax: 200, fase: "Cosecha", recs: [
      "Cosecha cuando el grano esté seco y duro.",
      "No riegues más.",
      "Almacena en un lugar seco."
    ], esCosecha: true }
  ]
};

/* Recomendaciones pre-siembra */
function recomendacionesPreSiembra(cultivo: string) {
  switch (cultivo) {
    case "Maíz":
      return [
        "Elige semillas certificadas y variedades resistentes.",
        "Prepara el terreno removiendo malezas.",
        "Realiza análisis de suelo antes de sembrar.",
        "Aporta abono de base según el análisis.",
        "Siembra a 2-5 cm de profundidad y 70 cm entre hileras.",
        "Si esperas lluvia intensa, espera para evitar encharcamientos.",
        "Evita sembrar con temperaturas menores a 12 °C."
      ];
    case "Papa":
      return [
        "Selecciona tubérculos sanos y desinfectados.",
        "Prepara surcos de 30 cm de profundidad.",
        "Analiza el suelo y ajusta pH si es necesario.",
        "Evita suelos encharcados y compactados.",
        "Siembra cuando la temperatura sea >10°C.",
        "Evita siembras muy profundas o superficiales."
      ];
    case "Frijol":
      return [
        "Escoge semillas tratadas contra hongos.",
        "Remueve malezas y rastrilla la tierra.",
        "No siembres en suelos muy fríos o húmedos.",
        "Siembra a 3-5 cm de profundidad y 50 cm entre hileras.",
        "Evita sembrar justo antes de lluvias intensas."
      ];
    case "Trigo":
      return [
        "Usa semilla certificada libre de patógenos.",
        "Prepara el suelo con arado y rastra.",
        "Realiza análisis y corrige deficiencias nutricionales.",
        "Siembra a 2-4 cm de profundidad y 20 cm entre hileras.",
        "Si se pronostican lluvias fuertes, retrasa la siembra."
      ];
    default:
      return [
        "Asegúrate de preparar bien el suelo y elegir semillas de calidad.",
        "Consulta recomendaciones específicas para tu cultivo."
      ];
  }
}

/* Recomendaciones por fase (robusta) */
function recomendacionesPorFase(cultivo: string, dias: number, clima: any) {
  const fases = FASES[cultivo];
  if (!Array.isArray(fases) || fases.length === 0) {
    return {
      fase: "Sin información",
      esCosecha: false,
      recomendaciones: [
        "No hay recomendaciones configuradas para este cultivo.",
        "Consulta con un asesor agrónomo o revisa la configuración del sistema."
      ]
    };
  }
  const temp = clima?.hourly?.temperature_2m?.[0] ?? 0;
  const lluvia = clima?.hourly?.precipitation?.[0] ?? 0;
  let faseData = fases.find(f => dias >= f.diasMin && dias <= f.diasMax);
  let extra: string[] = [];

  // Si está fuera de rango máximo: cosecha urgente
  if (!faseData) {
    const ultima = fases[fases.length - 1];
    faseData = {
      ...ultima,
      fase: "Post-cosecha (atrasado)",
      recs: [
        "Ciclo superado. Realiza cosecha urgente si no lo hiciste.",
        "No apliques riego ni fertilizante. Prepara el terreno para el siguiente ciclo."
      ],
      esCosecha: true
    };
  }

  // Extras de clima
  if (!faseData.esCosecha) {
    if (lluvia === 0) extra.push("No se espera lluvia. Considera riego artificial.");
    if (lluvia > 20) extra.push("Exceso de lluvia (>20 mm). Vigila encharcamientos y hongos.");
    if (temp > 35) extra.push("Temperatura extrema. Monitorea signos de estrés por calor.");
  }

  return {
    fase: faseData.fase,
    esCosecha: !!faseData.esCosecha,
    recomendaciones: Array.from(new Set([...(faseData.recs || []), ...extra]))
  };
}




export default function App() {
  const [coords, setCoords] = useState<number[][] | null>(null);
  const [cultivo, setCultivo] = useState("Maíz");
  const [yaSembro, setYaSembro] = useState<null | boolean>(null);
  const [fecha, setFecha] = useState("");
  const [clima, setClima] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [centro, setCentro] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lugar, setLugar] = useState<string | null>(null);
 

  // Persistencia (opcional)
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

  useEffect(() => {
  if (centro) {
    fetchNombreLugar(centro);
  } else {
    setLugar(null);
  }
}, [centro]);

  function centroPoligono(pol: number[][]) {
    let lat = 0, lng = 0;
    for (const [la, ln] of pol) { lat += la; lng += ln; }
    return [lat / pol.length, lng / pol.length];
  }

  const hoy = new Date();
  const fechaSiembraDate = fecha ? new Date(fecha) : null;
  const dias = fechaSiembraDate
    ? Math.floor((hoy.getTime() - fechaSiembraDate.getTime()) / 864e5)
    : 0;
  const fechaInvalida = fechaSiembraDate && fechaSiembraDate > hoy;

  // PROTEGIDO: Si el cultivo no existe, fallback seguro
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

  async function fetchNombreLugar([lat, lng]: [number, number]) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=es`;
    const { data } = await axios.get(url, {
      // no es obligatorio, pero ayuda con rate-limit:
      headers: { "User-Agent": "AgroInfoGT/1.0 (tu@email.com)" }
    });

    /* 1º-3º partes del “display_name” → texto corto */
    const bonito = (data.display_name as string)
      .split(",")
      .slice(0, 3)
      .map(t => t.trim())
      .join(", ");

    setLugar(bonito || null);
  } catch {
    setLugar(null);          // en error mostramos lat/lon
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

  // RENDER seguro y funcional
  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Toast global */}
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
                  Dibuja el cultivo de tu terreno, presiona el icono de la derecha y busca tu ubicacion

                  
                </h2>
                
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
                  Que fecha sembraste tu cultivo?
                </h2>
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

              {/* Ubicación */}
                <div className="bg-slate-900 rounded-xl p-4 h-28 sm:h-36 flex flex-col
                                justify-center items-center my-2">
                  <span className="text-teal-200 text-xs sm:text-base mb-2">
                    Ubicación central consultada
                  </span>

                  {lugar ? (
                    <span className="text-teal-200 font-bold text-center">{lugar}</span>
                  ) : centro ? (
                    <>
                      <span className="text-gray-300">Lat {centro[0].toFixed(5)}</span>
                      <span className="text-gray-300">Lng {centro[1].toFixed(5)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">Dibuja un polígono…</span>
                  )}
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

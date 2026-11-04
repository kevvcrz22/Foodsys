// Frontend/src/Paginas/Reportes/SelectorPeriodo.jsx
//
// Componente selector de periodo y filtros para el modulo de Reportes.
// Permite alternar entre Diario, Semanal (ISO-8601 semanas 1 a 52), Mensual, Anual y Personalizado.
//
// Ofrece selectores especificos segun la norma ISO-8601 y filtros por tipo de comida.

import React from "react";
import { Calendar, Filter, Clock } from "lucide-react";

const PERIODOS = [
  { Clave: "diario", Etiqueta: "Diario" },
  { Clave: "semanal", Etiqueta: "Semanal (ISO)" },
  { Clave: "mensual", Etiqueta: "Mensual" },
  { Clave: "anual", Etiqueta: "Anual" },
  { Clave: "personalizado", Etiqueta: "Rango Personalizado" },
];

const MESES = [
  { num: 1, nombre: "Enero" },
  { num: 2, nombre: "Febrero" },
  { num: 3, nombre: "Marzo" },
  { num: 4, nombre: "Abril" },
  { num: 5, nombre: "Mayo" },
  { num: 6, nombre: "Junio" },
  { num: 7, nombre: "Julio" },
  { num: 8, nombre: "Agosto" },
  { num: 9, nombre: "Septiembre" },
  { num: 10, nombre: "Octubre" },
  { num: 11, nombre: "Noviembre" },
  { num: 12, nombre: "Diciembre" },
];

const SelectorPeriodo = ({
  Periodo,
  Set_Periodo,
  FechaInicio,
  Set_FechaInicio,
  FechaFin,
  Set_FechaFin,
  TipoAlimento,
  Set_TipoAlimento,
  Anio,
  Set_Anio,
  SemanaISO,
  Set_SemanaISO,
  Mes,
  Set_Mes,
  ModoSemana,
  Set_ModoSemana
}) => {
  const anioActual = new Date().getFullYear();
  const aniosDisponibles = [anioActual - 2, anioActual - 1, anioActual, anioActual + 1];

  return (
    <div className="flex flex-col gap-4">
      {/* Botones de conmutacion de periodo */}
      <div className="flex gap-2 flex-wrap">
        {PERIODOS.map(({ Clave, Etiqueta }) => (
          <button
            key={Clave}
            onClick={() => Set_Periodo(Clave)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              Periodo === Clave
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {Etiqueta}
          </button>
        ))}
      </div>

      {/* Panel de filtros segun el periodo activo (para tabs no-diarios) */}
      {Periodo !== "diario" && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-end">
          {/* =========================================================
              FILTROS PARA MODO SEMANAL (ISO-8601)
          ========================================================= */}
          {Periodo === "semanal" && (
            <>
              {/* Conmutador entre Rango de Fechas vs Selector de Semana ISO */}
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Modalidad de Consulta
                </label>
                <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => Set_ModoSemana && Set_ModoSemana("iso")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                      ModoSemana === "iso" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-gray-500"
                    }`}
                  >
                    Semana ISO (1-52)
                  </button>
                  <button
                    type="button"
                    onClick={() => Set_ModoSemana && Set_ModoSemana("rango")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                      ModoSemana === "rango" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-gray-500"
                    }`}
                  >
                    Rango 7 Dias
                  </button>
                </div>
              </div>

              {ModoSemana === "iso" ? (
                <>
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                    <select
                      value={Anio}
                      onChange={(e) => Set_Anio && Set_Anio(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      {aniosDisponibles.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Semana ISO-8601 (1 a 52)
                    </label>
                    <select
                      value={SemanaISO}
                      onChange={(e) => Set_SemanaISO && Set_SemanaISO(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      {Array.from({ length: 52 }, (_, i) => i + 1).map((s) => (
                        <option key={s} value={s}>
                          Semana {s} {s <= 4 ? "(Mes 1)" : s <= 8 ? "(Mes 2)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Inicio</label>
                    <input
                      type="date"
                      value={FechaInicio}
                      onChange={(e) => Set_FechaInicio(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Fin</label>
                    <input
                      type="date"
                      value={FechaFin}
                      onChange={(e) => Set_FechaFin(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* =========================================================
              FILTROS PARA MODO MENSUAL
          ========================================================= */}
          {Periodo === "mensual" && (
            <>
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                <select
                  value={Anio}
                  onChange={(e) => Set_Anio && Set_Anio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {aniosDisponibles.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mes</label>
                <select
                  value={Mes}
                  onChange={(e) => Set_Mes && Set_Mes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {MESES.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* =========================================================
              FILTROS PARA MODO ANUAL
          ========================================================= */}
          {Periodo === "anual" && (
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
              <select
                value={Anio}
                onChange={(e) => Set_Anio && Set_Anio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {aniosDisponibles.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* =========================================================
              FILTROS PARA MODO PERSONALIZADO
          ========================================================= */}
          {Periodo === "personalizado" && (
            <>
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={FechaInicio}
                  onChange={(e) => Set_FechaInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={FechaFin}
                  onChange={(e) => Set_FechaFin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </>
          )}

          {/* Filtro comun: Tipo de Alimento */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Comida</label>
            <select
              value={TipoAlimento}
              onChange={(e) => Set_TipoAlimento(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="Todos">Todas las Comidas</option>
              <option value="Desayuno">Desayuno</option>
              <option value="Almuerzo">Almuerzo</option>
              <option value="Cena">Cena</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorPeriodo;

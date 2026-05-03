import { ChefHat, Clock, CreditCard, History, UtensilsCrossed } from "lucide-react";

function ItemRegistro({ item }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100
                    hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
      {/* Avatar inicial */}
      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center
                      text-indigo-700 font-bold text-sm shrink-0 group-hover:bg-indigo-200 transition-colors">
        {item.nombre?.[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800 text-sm truncate">{item.nombre || "Usuario"}</p>

        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
          <CreditCard className="w-3 h-3 shrink-0" />
          {item.doc}
        </p>

        {item.tipo && (
          <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5 truncate">
            <ChefHat className="w-3 h-3 shrink-0" />
            {item.tipo}
          </p>
        )}
      </div>

      {/* Hora */}
      <span className="text-xs text-slate-400 flex items-center gap-0.5 shrink-0 mt-0.5">
        <Clock className="w-3 h-3" />
        {item.hora}
      </span>
    </div>
  );
}

export default function Actividad({ registros }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col
                    max-h-[520px] lg:max-h-[640px]">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <History className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Actividad</h2>
            <p className="text-xs text-slate-400">Sesión actual</p>
          </div>
        </div>

        {registros.length > 0 && (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1
                           rounded-full border border-indigo-100">
            {registros.length}
          </span>
        )}
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scroll">
        {registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-slate-300">
            <UtensilsCrossed className="w-9 h-9" />
            <p className="text-sm">Sin registros aún</p>
          </div>
        ) : (
          registros.map((item, i) => <ItemRegistro key={i} item={item} />)
        )}
      </div>
    </div>
  );
}
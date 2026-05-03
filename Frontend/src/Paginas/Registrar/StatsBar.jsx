import { CheckCircle2, Clock, Users, XCircle } from "lucide-react";

// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, iconClass, value, label, flash, flashClass, extra }) {
  return (
    <div
      className={`bg-white rounded-2xl px-5 py-4 shadow-sm border flex items-center gap-4 transition-colors
        ${flash ? flashClass : "border-slate-200"}`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1 truncate">{label}</p>
        {extra}
      </div>
    </div>
  );
}

export default function StatsBar({ totalRegistros, reservasCanceladas, cancelFlash, horaDisplay }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
      <StatCard
        icon={Users}
        iconClass="bg-indigo-50 text-indigo-600"
        value={totalRegistros}
        label="Registrados hoy"
      />
      <StatCard
        icon={CheckCircle2}
        iconClass="bg-green-50 text-green-600"
        value="100%"
        label="Lecturas exitosas"
      />
      <StatCard
        icon={XCircle}
        iconClass="bg-red-50 text-red-500"
        value={reservasCanceladas}
        label="Canceladas hoy"
        flash={cancelFlash}
        flashClass="border-red-200 cancel-flash"
        extra={
          <span className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Tiempo real</span>
          </span>
        }
      />
      <StatCard
        icon={Clock}
        iconClass="bg-amber-50 text-amber-500"
        value={horaDisplay}
        label="Hora actual"
      />
    </div>
  );
}
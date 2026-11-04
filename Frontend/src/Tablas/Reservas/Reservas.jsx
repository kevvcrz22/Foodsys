// ReservasPage.jsx
//
// Pagina principal del modulo de reservas.
// Muestra en dos columnas:
//   Izquierda -> ReservaForm   (crear nueva reserva y generar QR)
//   Derecha   -> HistorialReservas (ver y cancelar reservas pasadas)
//
// En mobile ambas columnas se apilan verticalmente (historial debajo del formulario).

import ReservaForm from "./ReservaForm";
import HistorialReservas from "./HistorialReservas";

export default function ReservasPage() {
    return (
        <div className="min-h-screen bg-slate-50/70 px-3 py-4 sm:px-6 sm:py-8 w-full min-w-0 overflow-x-hidden">

            {/* Titulo de la pagina */}
            <div className="max-w-7xl mx-auto mb-6">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Mis Reservas</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Genera tu reserva para mañana y consulta tu historial
                </p>
            </div>

            {/* Layout responsive: se apila limpiamente en tablets/laptops y 2 columnas en pantallas amplias */}
            <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 items-start w-full min-w-0">

                {/* Columna izquierda: formulario de reserva */}
                <div className="w-full xl:w-[500px] 2xl:w-[540px] shrink-0 min-w-0">
                    <ReservaForm />
                </div>

                {/* Divisor visible solo en pantallas xl */}
                <div className="hidden xl:block w-px bg-slate-200 self-stretch" />

                {/* Columna derecha: historial de reservas */}
                <div className="w-full xl:flex-1 min-w-0">
                    <HistorialReservas />
                </div>

            </div>
        </div>
    );
}
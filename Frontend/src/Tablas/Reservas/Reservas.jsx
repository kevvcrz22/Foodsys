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
        <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">

            {/* Titulo de la pagina */}
            <div className="max-w-6xl mx-auto mb-6">
                <h1 className="text-xl font-bold text-slate-800">Mis Reservas</h1>
                <p className="text-sm text-slate-400">
                    Genera tu reserva para mañana y consulta tu historial
                </p>
            </div>

            {/* Layout de dos columnas */}
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-start">

                {/* Columna izquierda: formulario de reserva */}
                <div className="w-full lg:w-[480px] shrink-0">
                    <ReservaForm />
                </div>

                {/* Divisor visible solo en desktop */}
                <div className="hidden lg:block w-px bg-slate-200 self-stretch" />

                {/* Columna derecha: historial de reservas */}
                <div className="w-full lg:flex-1">
                    <HistorialReservas />
                </div>

            </div>
        </div>
    );
}
// Se muestra solo si el usuario tiene más de un rol.
// Los roles llegan desde App (que los obtiene de la BD al hacer login).
// Si necesitas cargarlos directamente desde aquí, puedes hacer fetch a tu API
// dentro de un useEffect y manejar el estado localmente.

const ROLES_EXCLUIDOS = ["Aprendiz Interno"];

const NavRolSelector = ({ usuario, roles = [], rolActivo, onCambioRol }) => {
  if (!usuario || roles.length <= 1) return null;

  const rolesVisibles = [...new Set(roles)].filter(
    (r) => !ROLES_EXCLUIDOS.includes(r)
  );

  return (
    <select
      value={rolActivo || ""}
      onChange={(e) => onCambioRol(e.target.value)}
      className="
        bg-transparent text-white font-semibold
        px-2 py-1 cursor-pointer appearance-none
        border-none outline-none
        hover:text-gray-300 transition-colors duration-200
      "
    >
      {rolesVisibles.map((r) => (
        <option key={r} value={r} className="text-black">
          {r}
        </option>
      ))}
    </select>
  );
};

export default NavRolSelector;
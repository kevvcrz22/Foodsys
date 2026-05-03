import { useNavigate } from "react-router-dom";

export const useNavBar = ({ onCambioRol, onCerrarSesion } = {}) => {
  const navigate = useNavigate();

  const handleCambioRol = (nuevoRol) => {
    localStorage.setItem("rolActivo", nuevoRol);
    onCambioRol?.(nuevoRol);
  };

  const handleCerrarSesion = () => {
    localStorage.clear();
    onCerrarSesion?.();
    navigate("/");
  };

  return { handleCambioRol, handleCerrarSesion };
};
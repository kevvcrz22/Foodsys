import { Link } from "react-router-dom";
import logo from "../Img/LogoFoodsys.png";

const NavLogo = () => (
  <Link to="/" className="flex items-center gap-3">
    <img src={logo} alt="Logo Foodsys" className="w-12 h-12" />
    <span className="font-bold text-2xl uppercase tracking-wide">Foodsys</span>
  </Link>
);

export default NavLogo;
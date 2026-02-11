import {Link} from 'react-router-dom';


    const Footer = () => {
        return (
            <>
                <footer>
                    <div className="footer-content">
                    <div className="footer-column">
                        <h3>Foodsys</h3>
                        <p>Sistema de gestión alimentaria del Centro Agropecuario La Granja - SENA Regional Tolima.</p>
                        <div className="social-links">
                        <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                        <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                        </div>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Enlaces rápidos</h3>
                        <a href="Index.html">Inicio</a>
                        <a href="#">Contacto</a>
                        <a href="#">¿Qué es foodsys?</a>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Recursos</h3>
                        <a href="#">Preguntas frecuentes</a>
                        <a href="#">Política de privacidad</a>
                        <a href="#">Términos de uso</a>
                        <a href="#">Soporte técnico</a>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Contacto</h3>
                        <p><i className="fas fa-map-marker-alt"></i> Centro Agropecuario La Granja, Tolima</p>
                        <p><i className="fas fa-phone"></i> +57 (322) 947-3491</p>
                        <p><i className="fas fa-envelope"></i> foodsys.edu.co</p>
                    </div>
                    </div>
                    
                    <div className="footer-bottom">
                    <p>&copy; 2025 Foodsys - Sistema de Gestión Alimentaria. Todos los derechos reservados.</p>
                    </div>
                </footer>
            </>
        )
    }
export default Footer
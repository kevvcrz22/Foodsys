import nodeMailer from 'nodemailer'

class EmailService {
    getTransportador(){
        return nodeMailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.EMAIL_PASS
            }
        })
    }
    async sendPasswordResetEmail(email, tokenForPassword) {

    const transporter = this.getTransportador();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${tokenForPassword}`

    const mailOptions = {
        from: `"Soporte Foodsys" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Restablecer contraseña",
        html: `<h2>Recuperación de contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <a href="${resetUrl}">Restablecer contraseña</a>
        <p>Este enlace vence en 15 minutos.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>`
    }

    return await transporter.sendMail(mailOptions)
}
}
export default new EmailService()
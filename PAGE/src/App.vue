<script setup>
import { ref } from 'vue';
import { 
  Scale, 
  ChevronRight, 
  Phone, 
  MapPin, 
  Clock,
  Mail,
  CheckCircle,
  FileSignature,
  Home,
  Briefcase,
  BriefcaseBusiness,
  Stamp,
  Star,
  Users,
  Building,
  MessageCircle
} from 'lucide-vue-next';

const whatsappNumber = "524431234567";
const whatsappMessage = encodeURIComponent("Hola, me gustaría solicitar información y agendar una cita en la Notaría Publica 196.");
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

const categoriasServicios = ref([
  {
    id: 1,
    titulo: "Familiar y Sucesiones",
    icono: Users,
    items: [
      "Juicios Sucesorios (Testamentarios e Intestamentarios)",
      "Testamentos",
      "Donaciones"
    ]
  },
  {
    id: 2,
    titulo: "Inmobiliario",
    icono: Building,
    items: [
      "Compraventas",
      "Compraventa con reserva de dominio",
      "Cancelación de hipotecas",
      "Dación de pago",
      "Fideicomisos"
    ]
  },
  {
    id: 3,
    titulo: "Corporativo y Financiero",
    icono: BriefcaseBusiness,
    items: [
      "Constitución de personas morales",
      "Mutuos con interés y garantía",
      "Mutuos simples",
      "Adjudicaciones judiciales",
      "Contratos"
    ]
  },
  {
    id: 4,
    titulo: "Actas y Varios",
    icono: Stamp,
    items: [
      "Protocolización de actas",
      "Poderes",
      "Ratificaciones",
      "Actas destacadas fuera del protocolo",
      "Asesorías legales"
    ]
  }
]);
</script>

<template>
  <div class="landing-page">
    <!-- Navbar (Glassmorphism) -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo">
          <img src="/logo_notaria.jpeg" alt="Logo Notaría" class="logo-image" />
        </div>
        <div class="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <header class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-container">
        <div class="hero-text">
          <h1 class="hero-title">Seguridad Jurídica para tu <span>Patrimonio</span></h1>
          <span class="badge">Excelencia Legal desde 1995</span>
          <p class="hero-subtitle">
            Brindamos servicios notariales con integridad, rapidez y certeza. 
            Protegemos lo que más importa para ti y tu familia.
          </p>
          <div class="hero-cta-group">
            <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-hero">
              <MessageCircle class="btn-icon" />
              Agendar Cita por WhatsApp
            </a>
          </div>
        </div>
        
        <div id="contacto" class="hero-info-card">
          <h3>Contacto</h3>
          <ul class="contact-list-hero">
            <li>
              <Phone class="contact-icon" />
              <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="contact-link">
                WhatsApp / Citas: 443 123 4567
              </a>
            </li>
            <li>
              <Mail class="contact-icon" />
              <span>notariapublica196@outlook.com</span>
            </li>
            <li class="align-start">
              <MapPin class="contact-icon mt-1" />
              <span>Periférico Paseo de la República 3140-5.<br>Plaza Gea. Morelia, Mich.</span>
            </li>
            <li class="align-start">
              <Clock class="contact-icon mt-1" />
              <span>Lunes a Viernes: 9:00 a 16:00</span>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <!-- Services Section -->
    <section id="servicios" class="services">
      <div class="services-container">
        <div class="section-header">
          <h2>Trámites y Servicios</h2>
          <p>Asesoría profesional adaptada a tus necesidades legales y patrimoniales</p>
        </div>

        <div class="category-grid">
          <div v-for="categoria in categoriasServicios" :key="categoria.id" class="category-card">
            <div class="category-header">
              <component :is="categoria.icono" class="category-main-icon" />
              <h3>{{ categoria.titulo }}</h3>
            </div>
            <ul class="category-list">
              <li v-for="(item, idx) in categoria.items" :key="idx">
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Nosotros Section -->
    <section id="nosotros" class="about">
      <div class="about-container">
        <div class="about-image">
          <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800" alt="Notaria Titular" />
        </div>
        <div class="about-text">
          <h2>Sobre Nuestra Notaría</h2>
          <p>
            Con más de 25 años de experiencia, nuestro equipo de profesionales del derecho está dedicado a brindar certeza jurídica y proteger el patrimonio de nuestros clientes con absoluta transparencia.
          </p>
          <p>
            Nos regimos por los más altos estándares éticos, ofreciendo atención personalizada y soluciones legales eficaces para empresas y familias.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-about">
          <div class="logo">
            <img src="/logo_notaria.jpeg" alt="Logo Notaría" class="logo-image" />
          </div>
          <p>Comprometidos con la legalidad, la transparencia y el servicio al cliente.</p>
        </div>
        
        <div class="footer-links">
          <h3>Enlaces Rápidos</h3>
          <a href="#">Aviso de Privacidad</a>
          <a href="#">Términos y Condiciones</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Notaría Pública. Todos los derechos reservados.</p>
      </div>
    </footer>

    <!-- Botón Flotante de WhatsApp -->
    <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="floating-whatsapp" title="Agendar Cita por WhatsApp">
      <svg class="whatsapp-svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.763.459 3.486 1.332 5.001L2 22l5.12-1.339c1.464.798 3.119 1.219 4.887 1.22h.005c5.507 0 9.99-4.479 9.99-9.986 0-2.668-1.039-5.176-2.927-7.063C17.186 3.037 14.677 2 12.012 2zm5.952 14.372c-.25.702-1.246 1.341-1.748 1.428-.465.08-.946.126-1.503-.058-.337-.11-.777-.253-1.488-.56-3.003-1.298-4.962-4.323-5.113-4.524-.15-.201-1.228-1.636-1.228-3.12 0-1.484.777-2.215 1.052-2.516.275-.301.601-.376.802-.376.201 0 .401.001.576.01.188.01.439-.071.689.526.25.597.852 2.08.927 2.23.075.15.125.326.025.526-.1.201-.15.326-.301.502-.15.175-.315.392-.45.526-.15.15-.306.313-.131.613.175.301.781 1.288 1.674 2.083 1.148 1.023 2.118 1.341 2.419 1.491.301.15.476.125.651-.075.175-.201.752-.877.952-1.178.2-.301.401-.25.676-.15.275.1.1.752.852 2.181 2.08.075.15.125.326.075.476-.05.15-.25.376-.501.702z"/>
      </svg>
      <span class="whatsapp-tooltip">¡Agenda tu Cita por WhatsApp!</span>
    </a>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700;800&display=swap');

.landing-page {
  font-family: 'Inter', sans-serif;
  color: #cbd5e1;
  background-color: #2E334A; /* Dark background */
  overflow-x: hidden;
}

/* --- Typography & Basics --- */
h1, h2, h3 {
  margin: 0;
  color: #ffffff;
  font-family: 'Playfair Display', serif;
}
p {
  line-height: 1.7;
  color: #94a3b8;
}

/* --- Navbar --- */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem 0;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  transition: all 0.3s ease;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: #2E334A;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #F4B116; /* Aged Bronze/Gold */
}

.logo-image {
  height: 65px;
  width: auto;
  object-fit: contain;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #F4B116;
}

/* --- Hero Section --- */
.hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  padding: 6rem 2rem 2rem;
  /* Notary interior image: wood desk, pen, legal atmosphere */
  background-image: url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80');
  background-size: cover;
  background-position: center;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(46, 51, 74, 0.95) 0%, rgba(46, 51, 74, 0.6) 100%);
}

.hero-container {
  position: relative;
  z-index: 10;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4rem;
  animation: fadeIn 1s ease-out forwards;
}

.hero-text {
  flex: 1;
  text-align: left;
}

.badge {
  display: inline-block;
  background: rgba(181, 140, 92, 0.15);
  color: #d4af37;
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(181, 140, 92, 0.4);
  font-family: 'Inter', sans-serif;
}

.hero-title {
  color: #ffffff;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1rem;
}

.hero-title span {
  color: #F4B116;
  font-style: italic;
}

.badge {
  background: rgba(181, 140, 92, 0.15);
  color: #d4af37;
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(181, 140, 92, 0.4);
  font-family: 'Inter', sans-serif;
}

.hero-subtitle {
  color: #e2e8f0;
  font-size: 1.125rem;
  max-width: 650px;
  margin-bottom: 2.5rem;
  font-weight: 300;
}

.hero-info-card {
  background: rgba(26, 32, 44, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem 2rem 2rem;
  border-radius: 1rem;
  color: #fff;
  flex-shrink: 0;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: left;
}

.hero-info-card h3 {
  color: #ffffff;
  font-size: 1.5rem;
  text-align: center;
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.75rem;
}

.contact-list-hero {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.contact-list-hero li {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
  color: #e2e8f0;
  line-height: 1.4;
}

.contact-list-hero li.align-start {
  align-items: flex-start;
}

/* --- Buttons --- */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #F4B116;
  color: #ffffff;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(181, 140, 92, 0.4);
  font-family: 'Inter', sans-serif;
}

.btn-primary:hover {
  background-color: #a07a4c;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(181, 140, 92, 0.5);
}





/* --- Services --- */
.services {
  padding: 6rem 2rem;
  background-color: #fdfbf7; /* Off-white / Cream */
  width: 100%;
}

.services-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2E334A; /* Dark elegant blue */
}

.section-header p {
  color: #4a5568;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.category-card {
  background: #ffffff;
  padding: 2.5rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  border-color: #e2e8f0;
}

.category-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.category-main-icon {
  width: 42px;
  height: 42px;
  color: #F4B116;
  margin-bottom: 1rem;
}

.category-header h3 {
  font-size: 1.35rem;
  font-weight: 600;
  color: #2E334A;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-list li {
  position: relative;
  padding-left: 1.25rem;
}

.category-list li::before {
  content: "✓";
  color: #F4B116;
  font-weight: bold;
  position: absolute;
  left: 0;
  top: 0;
  font-size: 1.1rem;
  line-height: 1.3;
}

.category-list span {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
}

/* --- Nosotros --- */
.about {
  padding: 6rem 2rem;
  background-color: #2E334A; 
  width: 100%;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 4rem;
}

.about-image {
  flex: 1;
}

.about-image img {
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  display: block;
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  object-fit: cover;
  aspect-ratio: 1 / 1;
}

.about-text {
  flex: 1;
}

.about-text h2 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

.about-text p {
  color: #cbd5e1;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

/* --- Footer --- */
.footer {
  background-color: #1D202F;
  color: #a0aec0;
  padding: 5rem 2rem 2rem;
}

.footer-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-about .logo {
  color: #ffffff;
  margin-bottom: 1rem;
}

.footer h3 {
  color: #ffffff;
  font-size: 1.125rem;
  margin-bottom: 1.5rem;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.contact-list li.align-start {
  align-items: flex-start;
}

.contact-icon {
  width: 18px;
  height: 18px;
  color: #F4B116;
  flex-shrink: 0;
}

.mt-1 {
  margin-top: 0.25rem;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-links a {
  color: #a0aec0;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #F4B116;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid #2d3748;
  text-align: center;
  font-size: 0.875rem;
}

/* --- Animations --- */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Responsive --- */
@media (max-width: 900px) {
  .hero-container {
    flex-direction: column;
    text-align: center;
    gap: 3rem;
  }
  
  .hero-text {
    text-align: center;
  }
  
  .hero-info-card {
    text-align: left;
  }
  
  .about-container {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none; /* simple mobile menu hidden for now */
  }
  .hero-title {
    font-size: 2rem;
  }
  .category-grid {
    grid-template-columns: 1fr;
  }
}

/* --- WhatsApp CTA Styles --- */
.hero-cta-group {
  margin-top: 1.75rem;
}

.btn-whatsapp-hero {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background-color: #25D366;
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.85rem 1.75rem;
  border-radius: 9999px;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
  transition: all 0.3s ease;
}

.btn-whatsapp-hero:hover {
  background-color: #20ba5a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
  color: #ffffff;
}

.btn-icon {
  width: 22px;
  height: 22px;
}

.contact-link {
  color: #ffffff;
  text-decoration: none;
  transition: color 0.2s;
}

.contact-link:hover {
  color: #25D366;
}

/* --- Floating WhatsApp Widget --- */
.floating-whatsapp {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background-color: #25D366;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.5);
  z-index: 999;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: pulse 2s infinite;
}

.floating-whatsapp:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(37, 211, 102, 0.7);
  color: #ffffff;
}

.whatsapp-svg {
  width: 32px;
  height: 32px;
}

.whatsapp-tooltip {
  position: absolute;
  right: 70px;
  background-color: #1e293b;
  color: #ffffff;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.floating-whatsapp:hover .whatsapp-tooltip {
  opacity: 1;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6); }
  70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
}

@media (max-width: 768px) {
  .floating-whatsapp {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 52px;
    height: 52px;
  }
  .whatsapp-svg {
    width: 28px;
    height: 28px;
  }
  .whatsapp-tooltip {
    display: none;
  }
}
</style>

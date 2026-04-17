import './App.css';
import Hero from './sections/Hero';
import PainPoints from './sections/PainPoints';
import Features from './sections/Features';
import HowItWorks from './sections/HowItWorks';
import Testimonials from './sections/Testimonials';
import CTA from './sections/CTA';
import Footer from './sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-mono-bg">
      <main>
        <Hero />
        <PainPoints />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;

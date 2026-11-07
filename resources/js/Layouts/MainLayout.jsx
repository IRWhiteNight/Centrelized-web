import Navbar from '../Components/PSB-Components/Navbar4';
import Footer from '../Components/PSB-Components/Footer';
import Splash from '../Components/Splash';

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen black text-white">
            <Splash />
            <Navbar />

            <main>{children}</main>

            <Footer />
        </div>
    );
}

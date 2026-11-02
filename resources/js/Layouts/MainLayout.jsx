import Navbar from '../Components/Navbar4';
import Footer from '../Components/Footer';
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

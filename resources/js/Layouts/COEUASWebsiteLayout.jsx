import NavigationBar from "../Components/COEUAS-Components/navigationbar";
import COEUASFooter from "../Components/COEUAS-Components/COEUASFooter";

export default function COEUASWebsiteLayout({ children }) {
    return (
        <NavigationBar>
            {children}
            <COEUASFooter />
        </NavigationBar>
    );
}

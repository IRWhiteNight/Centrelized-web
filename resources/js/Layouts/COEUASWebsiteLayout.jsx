import NavigationBar from "../Components/COEUAS-Components/navigationbar";

export default function COEUASWebsiteLayout({ children }) {
    return (
        <NavigationBar>
            {children}
        </NavigationBar>
    );
}

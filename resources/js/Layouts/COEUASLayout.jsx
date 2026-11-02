import NavigationBar from "../Components/Admin-COEUAS-Components/NavigationBar";

export default function COEUASLayout({ children }) {
    return (
        <NavigationBar>
            {children}
        </NavigationBar>
    );
}

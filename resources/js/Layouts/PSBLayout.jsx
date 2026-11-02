import NavigationBar from "../Components/Admin-PSB-Components/NavigationBar";

export default function PSBLayout({ children }) {
    return (
        <NavigationBar>
            {children}
        </NavigationBar>
    );
}

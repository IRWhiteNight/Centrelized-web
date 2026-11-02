
import AdminSidebar from "../Components/Admin-Components/AdminSidebar";
import AdminTopbar from "../Components/Admin-Components/AdminTopbar";
import "../../css/admin-css/admin-layout.css";

export default function AdminLayout({ children }) {
    return (
        <div className="admin-layout">
            <AdminSidebar />

            <div className="admin-content-wrapper">
                <AdminTopbar />

                <main className="admin-main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

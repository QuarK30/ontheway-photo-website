import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PhotoDetailPage } from "./pages/PhotoDetailPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPhotosPage } from "./pages/AdminPhotosPage";
import { AdminCommentsPage } from "./pages/AdminCommentsPage";
import { AdminGuard } from "./components/AdminGuard";
import { NicknameProvider } from "./contexts/NicknameContext";
import { NicknameModal } from "./components/NicknameModal";

function App() {
  return (
    <BrowserRouter>
      <NicknameProvider>
        <NicknameModal />
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/photos/:id" element={<PhotoDetailPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/photos" replace />} />
        <Route
          path="/admin/photos"
          element={
            <AdminGuard>
              <AdminPhotosPage />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/comments"
          element={
            <AdminGuard>
              <AdminCommentsPage />
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NicknameProvider>
    </BrowserRouter>
  );
}

export default App;

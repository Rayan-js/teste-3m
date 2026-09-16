import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { NewTicketPage } from "./pages/NewTicketPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketListPage } from "./pages/TicketListPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

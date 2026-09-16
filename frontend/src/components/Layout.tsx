import { Link, NavLink, Outlet, useMatch } from "react-router-dom";

function navLinkClass(isActive: boolean) {
  return isActive ? "nav__link nav__link--active" : "nav__link";
}

export function Layout() {
  const onNewTicketPage = useMatch("/tickets/new") !== null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="container app-header__inner">
          <Link to="/tickets" className="brand">
            Portal de Suporte
          </Link>
          <nav className="nav" aria-label="Navegação principal">
            <NavLink to="/tickets" className={({ isActive }) => navLinkClass(isActive && !onNewTicketPage)}>
              Tickets
            </NavLink>
            <NavLink to="/tickets/new" className={({ isActive }) => navLinkClass(isActive)}>
              Novo ticket
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container app-main">
        <Outlet />
      </main>
    </div>
  );
}

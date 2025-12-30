import Bills from './pages/Bills';
import Debt from './pages/Debt';
import Home from './pages/Home';
import Savings from './pages/Savings';
import Settings from './pages/Settings';
import Payday from './pages/Payday';


export const PAGES = {
    "Bills": Bills,
    "Debt": Debt,
    "Home": Home,
    "Savings": Savings,
    "Settings": Settings,
    "Payday": Payday,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};
import Bills from './pages/Bills';
import Debt from './pages/Debt';
import Home from './pages/Home';
import Payday from './pages/Payday';
import Savings from './pages/Savings';
import Settings from './pages/Settings';


export const PAGES = {
    "Bills": Bills,
    "Debt": Debt,
    "Home": Home,
    "Payday": Payday,
    "Savings": Savings,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};
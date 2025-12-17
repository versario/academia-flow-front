import Alumnos from './pages/Alumnos';
import Profesores from './pages/Profesores';
import Asignaturas from './pages/Asignaturas';
import Inscripciones from './pages/Inscripciones';
import Notas from './pages/Notas';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Alumnos": Alumnos,
    "Profesores": Profesores,
    "Asignaturas": Asignaturas,
    "Inscripciones": Inscripciones,
    "Notas": Notas,
}

export const pagesConfig = {
    mainPage: "Alumnos",
    Pages: PAGES,
    Layout: __Layout,
};
import type { AmbitoLegal } from '../types/catalogo';

/**
 * Busca recursivamente un ámbito por su ID dentro del árbol y devuelve el nodo completo.
 * @param tree Array de ámbitos (árbol)
 * @param id ID a buscar
 * @returns El objeto AmbitoLegal encontrado o null
 */
export const findAmbitoById = (tree: AmbitoLegal[], id: number): AmbitoLegal | null => {
    for (const node of tree) {
        if (node.id === id) {
            return node;
        }
        if (node.children && node.children.length > 0) {
            const found = findAmbitoById(node.children, id);
            if (found) {
                return found;
            }
        }
    }
    return null;
};

/**
 * Busca a qué Materia (nodo raíz) pertenece un ID de ámbito específico.
 * Recorre el árbol y si encuentra el ID en los descendientes de un nodo raíz,
 * devuelve la descripción de ese nodo raíz (Materia).
 * @param tree Array de ámbitos (árbol)
 * @param idAmbito ID del ámbito hijo (hoja)
 * @returns Nombre de la Materia (e.g., "Civil", "Penal") o "Desconocido"
 */
export const findMateriaByAmbitoId = (tree: AmbitoLegal[], idAmbito: number): string => {
    for (const materia of tree) {
        // Si el ID coincide con la materia misma (poco probable si es hoja, pero posible)
        if (materia.id === idAmbito) return materia.descripcion;

        // Buscar en los hijos de esta materia
        if (materia.children) {
            const found = findAmbitoById(materia.children, idAmbito);
            if (found) {
                return materia.descripcion;
            }
        }
    }
    return 'Desconocido';
};

/**
 * Aplana el árbol completo en un mapa ID -> Descripción para búsquedas rápidas directas.
 * Útil si solo necesitas el nombre del nodo específico y no su jerarquía.
 */
export const flattenAmbitos = (tree: AmbitoLegal[]): Record<number, string> => {
    const map: Record<number, string> = {};

    const traverse = (nodes: AmbitoLegal[]) => {
        nodes.forEach(node => {
            map[node.id] = node.descripcion;
            if (node.children) {
                traverse(node.children);
            }
        });
    };

    traverse(tree);
    return map;
};

/**
 * Busca recursivamente el path completo (breadcrumbs) hasta el nodo con el ID dado.
 * @param tree Array de ámbitos
 * @param idAmbito ID a buscar
 * @param currentPath Array acumulativo de descripciones
 * @returns Array de strings con el path (e.g. ['Civil', 'Familia', 'Divorcio']) o null si no lo encuentra.
 */
export const findPathByAmbitoId = (tree: AmbitoLegal[], idAmbito: number, currentPath: string[] = []): string[] | null => {
    for (const node of tree) {
        // Filtrar niveles que digan "Sin Categoría" o "Sin Subcategoría"
        const isPlaceholder = /Sin (Sub)?Categoría/i.test(node.descripcion);
        const newPath = isPlaceholder ? currentPath : [...currentPath, node.descripcion];

        if (node.id === idAmbito) {
            // Si el nodo final es un placeholder (raro pero posible), decidimos si mostrarlo o no.
            // Generalmente el nodo hoja no será "Sin Categoría", así que retornamos newPath.
            // Si fuera hoja y placeholder, newPath estaría vacío o con el padre. Se asume que hoja tiene valor real.
            return newPath;
        }

        if (node.children && node.children.length > 0) {
            const result = findPathByAmbitoId(node.children, idAmbito, newPath);
            if (result) {
                return result;
            }
        }
    }
    return null;
};

/**
 * Función helper asíncrona para obtener el nombre de la materia directamente.
 * Hace la llamada al servicio y busca en el árbol.
 */
import catalogoService from '../services/catalogoService';

export const getMateriaName = async (idAmbito: number): Promise<string> => {
    try {
        const tree = await catalogoService.getAmbitosLegales();
        return findMateriaByAmbitoId(tree, idAmbito);
    } catch (error) {
        console.error("Error al resolver materia:", error);
        return 'Desconocido';
    }
};

/**
 * Función helper asíncrona para obtener toda la ruta jerárquica formateada.
 * Ej: "Civil -> Familia -> Divorcio"
 */
export const getFullAmbitoPath = async (idAmbito: number): Promise<string> => {
    try {
        const tree = await catalogoService.getAmbitosLegales();
        const path = findPathByAmbitoId(tree, idAmbito);
        return path ? path.join(' -> ') : 'Desconocido';
    } catch (error) {
        console.error("Error al resolver path de ámbito:", error);
        return 'Desconocido';
    }
};

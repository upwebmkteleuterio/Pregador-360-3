import { ItemType } from '../store/useStore';

/**
 * Mapeia cada tipo de conteúdo para uma cor específica de borda lateral
 */
export const contentTypeColors: Record<ItemType, string> = {
  'Sermão': '#EAB308',       // Amarelo / Dourado
  'Série': '#3B82F6',        // Azul
  'Ilustração': '#EC4899',   // Rosa
  'Recursos 360': '#10B981', // Verde
  'Estudo': '#A855F7',       // Roxo
  'Escritor': '#06B6D4',     // Ciano
  'Liderança': '#F59E0B',    // Laranja
};

/**
 * Retorna a cor correspondente ao tipo de conteúdo fornecido
 */
export function getBorderColorForType(type: ItemType): string {
  return contentTypeColors[type] || '#EAB308';
}
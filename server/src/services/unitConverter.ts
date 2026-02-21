import { Unit } from '@prisma/client';

export interface ConversionResult {
  quantity: number;
  unit: Unit;
}

/**
 * Convert a quantity from one unit to another
 * Only converts within the same unit type (weight to weight, volume to volume)
 */
export function convertUnit(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit
): number {
  // If units are the same, no conversion needed
  if (fromUnit.id === toUnit.id) {
    return quantity;
  }

  // Check if units are compatible (same type)
  if (fromUnit.unitType !== toUnit.unitType) {
    throw new Error(
      `Cannot convert between different unit types: ${fromUnit.unitType} and ${toUnit.unitType}`
    );
  }

  // Convert to base unit, then to target unit
  const quantityInBase = quantity * fromUnit.conversionToBase;
  const convertedQuantity = quantityInBase / toUnit.conversionToBase;

  return convertedQuantity;
}

/**
 * Convert quantity to base unit for the unit type
 */
export function toBaseUnit(quantity: number, unit: Unit): number {
  return quantity * unit.conversionToBase;
}

/**
 * Find the most appropriate display unit for a quantity in base units
 * For example: 1500g -> 1.5kg, 2500ml -> 2.5l
 */
export function findBestDisplayUnit(
  quantityInBase: number,
  unitType: string,
  availableUnits: Unit[]
): ConversionResult {
  // Filter units by type and sort by conversion factor (descending)
  const unitsOfType = availableUnits
    .filter((u) => u.unitType === unitType)
    .sort((a, b) => b.conversionToBase - a.conversionToBase);

  // Find the largest unit where the quantity is >= 1
  for (const unit of unitsOfType) {
    const convertedQuantity = quantityInBase / unit.conversionToBase;
    if (convertedQuantity >= 1) {
      return {
        quantity: Math.round(convertedQuantity * 100) / 100, // Round to 2 decimals
        unit,
      };
    }
  }

  // If no suitable unit found, use the smallest unit
  const smallestUnit = unitsOfType[unitsOfType.length - 1];
  return {
    quantity: Math.round((quantityInBase / smallestUnit.conversionToBase) * 100) / 100,
    unit: smallestUnit,
  };
}

/**
 * Aggregate quantities of the same ingredient with different units
 */
export function aggregateQuantities(
  items: Array<{ quantity: number; unit: Unit }>,
  allUnits: Unit[],
  ingredientName?: string
): ConversionResult {
  if (items.length === 0) {
    throw new Error('No items to aggregate');
  }

  const unitType = items[0].unit.unitType;

  // Convert all to base unit and sum
  const totalInBase = items.reduce((sum, item) => {
    if (item.unit.unitType !== unitType) {
      const ingredientInfo = ingredientName ? ` for ingredient "${ingredientName}"` : '';
      throw new Error(
        `All items must have the same unit type${ingredientInfo}. Found ${item.unit.unitType} but expected ${unitType} (unit: ${item.unit.name})`
      );
    }
    return sum + toBaseUnit(item.quantity, item.unit);
  }, 0);

  // Find best display unit
  return findBestDisplayUnit(totalInBase, unitType, allUnits);
}

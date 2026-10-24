export function validateRanking(rankedIds: readonly string[], eligibleIds: readonly string[], ownEntryId: string | null): void {
 const expected=eligibleIds.filter(id=>id!==ownEntryId);
 if(expected.length<2) throw new Error("No hay suficientes fotografías para votar.");
 if(rankedIds.length!==expected.length || new Set(rankedIds).size!==expected.length ||
    rankedIds.some(id=>!expected.includes(id))) throw new Error("Debes ordenar todas las fotografías elegibles, sin repetir ninguna.");
}

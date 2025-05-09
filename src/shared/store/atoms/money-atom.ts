import { atom, Atom } from "@rbxts/charm";

interface Money {
	current: number; // Money towards the *current* active collector's goal
	goal: number; // Goal for the *current* active collector
	collectorsRequired: number; // Total collectors needed for the level
	collectorsCompleted: number; // Collectors already completed
}

export const money: Atom<Money> = atom({
	current: 0,
	goal: 0,
	collectorsRequired: 0,
	collectorsCompleted: 0,
});

/**
 * Sets the initial money state for a new level.
 * @param goal The money goal for each collector.
 * @param requiredCollectors The total number of collectors for the level.
 */
export function setInitialMoneyState(goal: number, requiredCollectors: number) {
	return money((prev) => ({
		...prev,
		current: 0,
		goal: goal,
		collectorsRequired: requiredCollectors,
		collectorsCompleted: 0,
	}));
}

/**
 * Increments the current money collected towards the active collector's goal.
 * @param amount The amount to add.
 */
export function incrementCollectedValue(amount: number) {
	return money((prev) => ({
		...prev,
		current: prev.current + amount,
	}));
}

/**
 * Resets the current money count and increments the completed collector count.
 * Should be called when the active collector's goal is met.
 */
export function completeCurrentCollector() {
	return money((prev) => ({
		...prev,
		current: 0,
		collectorsCompleted: prev.collectorsCompleted + 1,
	}));
}

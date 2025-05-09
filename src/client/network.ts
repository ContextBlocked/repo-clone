import { GlobalEvents, GlobalEventsWithoutValidation, GlobalFunctions } from "shared/network";

export const Events = GlobalEvents.createClient({ disableIncomingGuards: true });
export const EventsWithoutValidation = GlobalEventsWithoutValidation.createClient({ disableIncomingGuards: true });
export const Functions = GlobalFunctions.createClient({});

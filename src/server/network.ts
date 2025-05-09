import { GlobalEvents, GlobalEventsWithoutValidation, GlobalFunctions } from "shared/network";

export const Events = GlobalEvents.createServer({});
export const EventsWithoutValidation = GlobalEventsWithoutValidation.createServer({ disableIncomingGuards: true });
export const Functions = GlobalFunctions.createServer({});

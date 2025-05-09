import { Centurion } from "@rbxts/centurion";

const server = Centurion.server();

declare const script: {
	commands: Folder;
	types: Folder;
};

// Load all child ModuleScripts under each container
const commandContainer = script.commands;
server.registry.load(commandContainer);

const typeContainer = script.types;
server.registry.load(typeContainer);

// Any loaded commands and types will then be registered once Centurion is started
export const startCenturion = () => {
	print("Starting Centurion server...");
	server.start();
};

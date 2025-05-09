_G.NOCOLOR = true

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterPlayerScripts = game:GetService("StarterPlayer").StarterPlayerScripts

local Jest = require(ReplicatedStorage.rbxts_include.node_modules["@rbxts"].jest.src)

local status, result = Jest.runCLI(script, {
	verbose = false,
	ci = false,
	setupFiles = { script.Parent.setup },
}, {
	ReplicatedStorage.TS.__tests__,
	StarterPlayerScripts.TS.__tests__,
	ServerScriptService.TS.__tests__,
}):awaitStatus()

if status == "Rejected" then
	print(result)
	error("Tests failed")
end
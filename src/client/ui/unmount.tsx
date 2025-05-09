import Vide, { cleanup, effect, Show, source } from "@rbxts/vide";
import { setTimeout } from "@rbxts/set-timeout";

interface DelayedProps {
	when?: () => boolean;
	beforeMount?: number;
	beforeUnmount?: number;
	children: () => Vide.Node;
}

export function Delayed({ when = () => true, beforeMount, beforeUnmount, children }: DelayedProps) {
	const shouldRender = source(when());

	effect(() => {
		const rendering = when();
		const timeout = rendering ? beforeMount : beforeUnmount;

		const handle = setTimeout(() => {
			shouldRender(rendering);
		}, timeout ?? -1);

		cleanup(handle);
	});

	return <Show when={shouldRender}>{children}</Show>;
}

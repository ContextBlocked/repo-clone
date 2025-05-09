# Scripting API

Flamework exposes a `Components` singleton which can be used on both server and client. Inside, there are several methods that allow you to interface with Flamework's components. You can grab a reference to this singleton the same way as you do any others, [as documented](https://github.com/rbxts-flamework/documentation/blob/master/docs/guides/dependencies).

## Retrieving a component

If you'd like to retrieve the component attached to a specific instance, you can use `Components.getComponent<T>(instance)`.

There is additionally `Components.waitForComponent<T>(instance)` whenever you want to wait for a component to be added to the specific instance. This returns a promise that can be cancelled to clear up resources if necessary.

```typescript
import { Components } from "@flamework/components";
import { Dependency } from "@flamework/core"; // Assuming Dependency is imported like this

const components = Dependency<Components>();
const myComponent = components.getComponent<MyComponent>(game); // Assuming 'game' is a valid instance
if (myComponent) {
    myComponent.method();
}

components.waitForComponent<MyComponent>(game).then((myComponent) => {
    myComponent.method();
});
```

## Adding/removing a component

Similarly, if you'd like to add a component to a specific instance, you can use `Components.addComponent<T>(instance)`.

If you'd like to remove a component, you can use `Components.removeComponent<T>(instance)`.

**Disclaimer:** Components added via the scripting API do not get removed automatically. It is recommended that you use the `tag` config option which will automatically create and cleanup components, and also supports StreamingEnabled on the client.

```typescript
import { Components } from "@flamework/components";
import { Dependency } from "@flamework/core"; // Assuming Dependency is imported like this

const components = Dependency<Components>();
components.addComponent<MyComponent>(game); // Assuming 'game' is a valid instance
components.removeComponent<MyComponent>(game);
```

## Polymorphic APIs

Sometimes, you might want components to support generic features like `OnInteract`, or `BaseEnemy`, however the `getComponent` API will only fetch exact components.

Flamework exposes two APIs to support this behavior:
- `Components.getComponents<T>(instance)`: Gets all components on an instance that match the type `T` (including interfaces or superclasses).
- `Components.getAllComponents<T>()`: Gets all components across all instances that match the type `T`.

```typescript
const components = Dependency<Components>();

// A hypothetical OnInteract interface, similar to a lifecycle event.
print("interactable components:", components.getComponents<OnInteract>(Workspace.MyInteractableItem));

// Getting all components that extend a BaseEnemy class.
print("enemies:", components.getAllComponents<BaseEnemy>());
```

## Listening for components

You can use the `onComponentAdded` and `onComponentRemoved` APIs to listen for when certain components are added or removed.

These methods both support polymorphism, which means you can match based on interfaces or superclasses (such as `OnInteract` and `BaseEnemy`).

```typescript
components.onComponentAdded<OnInteract>((value) => print("Interactable component was added!"));
components.onComponentRemoved<BaseEnemy>((value) => print("An enemy was removed!"));
```

# Creating a Component

A component is a class which is attached to a Roblox instance. It's able to access lifecycle events, as well as use constructor Dependency Injection (DI). A component is useful for representing objects inside of your game world, for example a door, a vehicle or a weapon.

Refer to [Lifecycle Events](https://github.com/rbxts-flamework/documentation/blob/master/docs/guides/lifecycle-events) for which lifecycle events work on components.

## Declaring the component

Declaring a component is very similar to the way you declare singletons, except you must extend the base component class: `BaseComponent`.

```typescript
import { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";

@Component()
export class MyComponent extends BaseComponent implements OnStart {
    constructor(private myDependency: MyDependency) {
        super();
    }

    onStart() {
        print(`Wow! I'm attached to ${this.instance.GetFullName()}`);
    }
}
```

## Using the component

There are two ways you can attach an instance to a component:
1.  The [Scripting API](https://github.com/rbxts-flamework/documentation/blob/master/docs/additional-modules/components/scripting-api)
2.  A CollectionService tag.

If you'd like to use a CollectionService tag, specify it in your Component's configuration:

```typescript
@Component({
    tag: "my-cs-tag",
})
```

## Instance type

You likely only want your component to be instantiated on the correct objects. The first type parameter of `BaseComponent` is for [attributes](https://github.com/rbxts-flamework/documentation/blob/master/docs/additional-modules/components/attributes), however the second allows you to specify a custom Instance type. Flamework will automatically generate a type guard for it, and prevent attaching your component to invalid objects.

```typescript
interface MyComponentInstance extends Model {
    hinge: BasePart & {
        constraint: HingeConstraint
    },
}

export class MyComponent extends BaseComponent<{}, MyComponentInstance> implements OnStart {
    onStart() {
        print(this.instance.hinge.constraint);
    }
}
```

## Component Dependencies

Flamework supports inter-component dependencies using dependency injection. This only works for components attached to the same instance.

Flamework will wait until any component dependencies have been added before creating your component.

```typescript
class MyComponent extends BaseComponent {}

// MyOtherComponent will not be created until MyComponent is added to the same instance
class MyOtherComponent extends BaseComponent {
    constructor(private myComponent: MyComponent) {}
}
```

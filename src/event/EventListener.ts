import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

export class EventListener {
  protected readonly dependencies: ListenerDependencies;
  constructor(dependencies: ListenerDependencies) {
    this.dependencies = dependencies;
  }
}

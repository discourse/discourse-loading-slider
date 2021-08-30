import Component from "@ember/component";
import { inject as service } from "@ember/service";
import { equal } from "@ember/object/computed";
import { cancel, next } from "@ember/runloop";
import discourseComputed from "discourse-common/utils/decorators";

export default Component.extend({
  loadingIndicator: service(),

  classNames: "loading-indicator-container",
  classNameBindings: ["ready", "loading", "stillLoading:still-loading", "done"],

  state: "ready",

  ready: equal("state", "ready"),
  loading: equal("state", "loading"),
  stillLoading: equal("state", "still-loading"),
  done: equal("state", "done"),

  stateChanged(loading) {
    if (this._deferredStateChange) {
      cancel(this._deferredStateChange);
      this._deferredStateChange = null;
    }

    if (loading && this.ready) {
      this.set("state", "loading");
    } else if (loading) {
      this.set("state", "ready");
      this._deferredStateChange = next(() => this.set("state", "loading"));
    } else {
      this.set("state", "done");
    }
  },

  didInsertElement() {
    this.loadingIndicator.on("stateChanged", this, "stateChanged");

    const bar = this.element.querySelector(".loading-indicator");

    this.element.addEventListener("transitionend", (event) => {
      if (event.target == this.element && event.propertyName == "opacity") {
        this.set("state", "ready");
      } else if (
        event.target === bar &&
        event.propertyName == "width" &&
        this.state == "loading"
      ) {
        this.set("state", "still-loading");
      }
    });
  },

  willDestroyElement() {
    this.loadingIndicator.off("stateChange", this, "stateChange");
  },
});

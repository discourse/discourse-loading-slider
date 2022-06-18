import { apiInitializer } from "discourse/lib/api";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { observes } from "discourse-common/utils/decorators";
import DiscourseURL from "discourse/lib/url";

const PLUGIN_ID = "discourse-loading-slider";

export default apiInitializer("0.8", (api) => {
  // eslint-disable-next-line no-undef
  delete Ember.TEMPLATES["loading"];
  const { isAppWebview } = api.container.lookup("capabilities:main");

  api.modifyClass("route:application", {
    pluginId: PLUGIN_ID,
    loadingIndicator: service(),

    @action
    loading(transition) {
      this.loadingIndicator.start();
      transition.promise.finally(() => {
        this.loadingIndicator.end();
      });

      let superLoading = this._super();
      if (superLoading !== null) {
        return superLoading;
      }

      return true;
    },
  });

  api.modifyClass("component:scrolling-post-stream", {
    pluginId: PLUGIN_ID,

    // Core currently relies on the intermediate loading screen to reload the scrolling-post-stream
    // component. This change should probably be made in core, but keeping it here for now.
    @observes("posts")
    _postsChanged() {
      this._refresh();
    },

    // When refresh is called, the posts on screen might be different, and they might even belong
    // to a different topic. Therefore we need to trigger _scrollTriggered to make sure the screen-track
    // service is updated about the change.
    _refresh(args) {
      this._super(args);
      this._scrollTriggered();
    },
  });

  api.modifyClass("component:topic-list-item", {
    pluginId: PLUGIN_ID,

    // Core updates the header with topic information as soon as a topic-list-item is clicked
    // This feels a little weird when the body is still showing old post content, so disable
    // that behavior.
    navigateToTopic(topic, href) {
      // this.appEvents.trigger("header:update-topic", topic); // This is the core line we're removing
      DiscourseURL.routeTo(href || topic.get("url"));
      return false;
    },
  });

  api.modifyClass("controller:discovery", {
    pluginId: PLUGIN_ID,

    set loading(value) {
      // no-op. We don't want the loading spinner to show on the discovery routes any more
    },
  });

  if (isAppWebview) {
    document.body.classList.add("discourse-hub-webview");
  }

  // Remove the custom refresh implementation and use the router
  api.modifyClass("controller:discovery/topics", {
    pluginId: PLUGIN_ID,

    @action
    refresh() {
      this.send("triggerRefresh");
    },
  });

  api.modifyClass("route:discovery", {
    pluginId: PLUGIN_ID,

    @action
    triggerRefresh() {
      this.refresh();
    },
  });
});

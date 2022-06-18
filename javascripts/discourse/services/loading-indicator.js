import Service from "@ember/service";
import Evented from "@ember/object/evented";
import { cancel, later, schedule } from "@ember/runloop";

const STORE_LOADING_TIMES = 5;
const DEFAULT_LOADING_TIME = 0.3;
const MIN_LOADING_TIME = 0.1;

const STILL_LOADING_DURATION = 2;

export default Service.extend(Evented, {
  init() {
    this._super();
    this.loadingTimes = [DEFAULT_LOADING_TIME];
    this.set("averageTime", DEFAULT_LOADING_TIME);
    this.i = 0;
    this.scheduled = [];
  },

  cancelScheduled() {
    this.scheduled.forEach((s) => cancel(s));
    this.scheduled = [];
  },

  start() {
    this.set("startedAt", Date.now());
    this.set("loading", true);
    this.trigger("stateChanged", true);

    this.cancelScheduled();

    this.scheduled.push(
      schedule("afterRender", () => {
        document.body.classList.add("loading");
        document.documentElement.style.setProperty(
          "--loading-duration",
          `${this.averageTime.toFixed(2)}s`
        );
      })
    );

    this.scheduled.push(
      later(this, "stillLoading", STILL_LOADING_DURATION * 1000)
    );
  },

  stillLoading() {
    this.scheduled.push(
      schedule("afterRender", () => {
        document.body.classList.add("still-loading");
      })
    );
  },

  end() {
    this.updateAverage((Date.now() - this.startedAt) / 1000);
    this.set("loading", false);
    this.trigger("stateChanged", false);

    this.cancelScheduled();
    this.scheduled.push(
      schedule("afterRender", () => {
        document.body.classList.remove("loading", "still-loading");
      })
    );
  },

  updateAverage(durationSeconds) {
    if (durationSeconds < MIN_LOADING_TIME) {
      durationSeconds = MIN_LOADING_TIME;
    }

    this.loadingTimes[this.i] = durationSeconds;

    this.i = (this.i + 1) % STORE_LOADING_TIMES;
    this.set(
      "averageTime",
      this.loadingTimes.reduce((p, c) => p + c, 0) / this.loadingTimes.length
    );
  },
});

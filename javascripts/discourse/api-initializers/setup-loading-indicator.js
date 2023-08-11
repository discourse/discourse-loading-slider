import { apiInitializer } from "discourse/lib/api";
import { addGlobalNotice } from "discourse/components/global-notice";
import getURL from "discourse-common/lib/get-url";

export default apiInitializer("0.8", (api) => {
  if (api.getCurrentUser()?.admin) {
    const themeId = themePrefix("foo").match(
      /theme_translations\.(\d+)\.foo/
    )[1];
    const themeURL = getURL(`/admin/customize/themes/${themeId}`);

    addGlobalNotice(
      `<b>Admin notice:</b> you're using the <em>discourse-loading-slider</em> theme component. The loading slider feature is now the default in Discourse core. You should <a href="${themeURL}">remove this theme component</a>.`,
      "loading-slider-theme",
      {
        dismissable: true,
        level: "warn",
        dismissDuration: moment.duration("1", "hour"),
      }
    );
  }
});

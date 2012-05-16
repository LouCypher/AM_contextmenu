/*
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var AM_Context = {

  toString: function AM_context_name() {
    "use strict";
    return "Add-ons Manager Context Menu";
  },

  getPopupNode: function AM_context_getPopupNode(aNode) {
    return "triggerNode" in aNode.parentNode
            ? aNode.parentNode.triggerNode
            : document.popupNode;
  },

  getAddon: function AM_context_addonsManager(aId, aCallback, aEvent) {
    if (gDetailView._addon) {
      aCallback(gDetailView._addon, aEvent);
      return;
    }

    AddonManager.getAllAddons(function(aAddons) {
      for (var i = 0; i < aAddons.length; i++) {
        if (aAddons[i].id == aId) {
          aCallback(aAddons[i], aEvent);
          return;
        }
      }
    })
  },

  copyToClipboard: function AM_context_copyToClipboard(aString) {
    Cc["@mozilla.org/widget/clipboardhelper;1"].
    getService(Ci.nsIClipboardHelper).copyString(aString);
  },

  copyName: function AM_context_copyName(aAddon) {
    AM_Context.copyToClipboard(aAddon.name);
  },

  copyVersion: function AM_context_copyVersion(aAddon) {
    AM_Context.copyToClipboard(aAddon.version);
  },

  copyNameVersion: function AM_context_copyNameVersion(aAddon) {
    AM_Context.copyToClipboard(aAddon.name + " " + aAddon.version);
  },

  copyGUID: function AM_context_copyGUID(aAddon) {
    AM_Context.copyToClipboard(aAddon.id);
  },

  copyURL: function AM_context_copyURL(aAddon) {
    AM_Context.copyToClipboard(aAddon.homepageURL);
  },

  browseDir: function AM_context_browseDir(aAddon) {
    var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
    dir.append("extensions");
    dir.append(aAddon.id);
    var nsLocalFile = Components.Constructor("@mozilla.org/file/local;1",
                                             "nsILocalFile", "initWithPath");
    (new nsLocalFile(dir.path + (dir.exists() ? "" : ".xpi"))).reveal();
  },

  inspectAddon: function AM_context_inspectAddon(aAddon) {
    inspectObject(aAddon);
  },

  goHome: function AM_context_goHome(aAddon) {
    var url = aAddon.homepageURL;
    if (!url) {
      if (aAddon.reviewURL) {
        url = aAddon.reviewURL.replace(/\/reviews\/.*$/, "/");
      } else {
        alert("This addon has no homepage!");
        return;
      }
    }
    openURL(url);
  },

  review: function AM_context_review(aAddon) {
    openURL(aAddon.reviewURL);
  },

  support: function AM_context_support(aAddon) {
    openURL(aAddon.supportURL);
  },

  setItemsAttributes: function AM_context_setItemsAttributes(aAddon, aEvent) {

    function AM_context_Item(aId) {
      return document.getElementById("AM-context-" + aId);
    }

    var addonType = aEvent.target.getAttribute("addontype");
    var isExtension = (addonType == "extension");
    var isTheme = (addonType == "theme");
    var isPlugin = (addonType == "plugin");
    var isUserStyle = (addonType == "userstyle");
    var isUserScript = (addonType == "user-script");

    var copyNameItem = AM_context_Item("copy-name");
    copyNameItem.tooltipText = aAddon.name;
    copyNameItem.disabled = isUserStyle;

    var copyVersionItem = AM_context_Item("copy-version");
    copyVersionItem.tooltipText = aAddon.version;
    copyVersionItem.disabled = isUserStyle;

    var copyNameVersionItem = AM_context_Item("copy-nameversion");
    copyNameVersionItem.tooltipText = aAddon.name + " " + aAddon.version;
    copyNameVersionItem.disabled = isUserStyle;

    var copyIdItem = AM_context_Item("copy-guid");
    copyIdItem.tooltipText = aAddon.id;
    copyIdItem.disabled = isUserStyle;

    var copyURLItem = AM_context_Item("copy-url");
    var goHomeItem = AM_context_Item("go-home");
    if (aAddon.homepageURL) {
      copyURLItem.tooltipText = goHomeItem.tooltipText = aAddon.homepageURL;
    } else if (aAddon.reviewURL) {
      copyURLItem.tooltipText =  goHomeItem.tooltipText =
        aAddon.reviewURL.replace(/\/reviews\/.*$/, "/");
    }
    copyURLItem.disabled = goHomeItem.disabled =
      !(aAddon.homepageURL || aAddon.reviewURL);

    var supportItem = AM_context_Item("go-support");
    supportItem.disabled = !aAddon.supportURL;
    supportItem.tooltipText = aAddon.supportURL;

    var reviewItem = AM_context_Item("reviews");
    reviewItem.disabled = !aAddon.reviewURL;

    var donateItem = AM_context_Item("donate");
    donateItem.disabled = !aAddon.contributionURL;
    donateItem.tooltipText =
               gStrings.ext.formatStringFromName("contributionAmount2",
                                                 [aAddon.contributionAmount],
                                                 1);

    AM_context_Item("browse-dir").disabled =
      isPlugin || isUserStyle || (isTheme && aAddon.iconURL &&
                                  /^https?/.test(aAddon.iconURL));

    var inspectItem = AM_context_Item("inspect-addon");
    inspectItem.disabled = !("inspectObject" in window);
    inspectItem.className = isUserScript ? "greasemonkey" : "";

    var separator = AM_context_Item("menuseparator-2");
    separator.className = isUserScript ? "greasemonkey" : "";
    separator.hidden = isUserStyle;
  },

  initPopup: function AM_context_initPopup(aEvent) {
    AM_Context.getAddon(document.popupNode.value,
                        AM_Context.setItemsAttributes,
                        aEvent);
  },

  onLoad: function AM_context_onLoad() {
    var popup = document.getElementById("addonitem-popup");
    popup.addEventListener("popupshowing", AM_Context.initPopup, false);
    popup.removeEventListener("popuphiding", AM_Context.initPopup, false);

  }
}

window.addEventListener("load", AM_Context.onLoad, false);
window.removeEventListener("unload", AM_Context.onLoad, false);

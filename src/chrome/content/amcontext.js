/*
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var AM_Context = {

  toString: function AM_context_name() {
    "use strict";
    try {
      return Services.prefs.getComplexValue("extensions.amcontextmenu@loucypher.name",
                                            Ci.nsIPrefLocalizedString).data;
    } catch(ex) {
      return "Add-ons Manager Context Menu";
    }
  },

  getPopupNode: function AM_context_getPopupNode(aNode) {
    return "triggerNode" in aNode.parentNode ? aNode.parentNode.triggerNode
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
    Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper)
                                               .copyString(aString);
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

  copyID: function AM_context_copyUUID(aAddon) {
    AM_Context.copyToClipboard(aAddon.id);
  },

  copyURL: function AM_context_copyURL(aAddon) {
    AM_Context.copyToClipboard(aAddon.homepageURL);
  },

  browseDir: function AM_context_browseDir(aAddon) {
    var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
    dir.append("extensions");
    dir.append(aAddon.id);
    var fileOrDir = dir.path + (dir.exists() ? "" : ".xpi");
    //Application.console.log(fileOrDir);
    var gecko = parseInt(Services.appinfo.platformVersion);
    var nsLocalFile = Components.Constructor("@mozilla.org/file/local;1",
                                             (gecko >= 14) ? "nsIFile" : "nsILocalFile",
                                             "initWithPath");
    try {
      (new nsLocalFile(fileOrDir)).reveal();
    } catch(ex) {
      var addonDir = /.xpi$/.test(fileOrDir) ? dir.parent : dir;
      try {
        if (addonDir.exists()) {
          addonDir.launch();
        }
      } catch(ex) {
        var uri = Services.io.newFileURI(addonDir, null, null);
        var protSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
                      getService(Ci.nsIExternalProtocolService);
        protSvc.loadUrl(uri);
      }
    }
  },

  inspectAddon: function AM_context_inspectAddon(aAddon) {
    inspectObject(aAddon);
  },

  inspectUserscript: function AM_context_inspectUserscript(aAddon) {
    inspectObject(aAddon._script);
  },

  goHome: function AM_context_goHome(aAddon) {
    var url = aAddon.homepageURL;
    if (!url) {
      if (aAddon.reviewURL) {
        url = aAddon.reviewURL.replace(/\/reviews\/.*$/, "/");
      } else {
        url = "https://addons.mozilla.org/search/?q="
            + encodeURIComponent(aAddon.name);
      }
    }
    openURL(url);
  },

  openReleaseNotes: function AM_context_releaseNotes(aAddon) {
    openURL(aAddon.releaseNotesURI.spec);
  },

  goAMO: function AM_context_goAMO(aAddon) {
    var amoURL = aAddon.reviewURL.replace(/\/reviews\//, "/");
    openURL(amoURL);
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
    var isScriptish = (addonType == "userscript");
    var isUserScript = (addonType == "user-script") || // Greasemonkey
                       (addonType == "userscript") ||  // Scriptish
                       (addonType == "greasemonkey-user-script"); // Greasemonkey 1.7+
    var isCustomButton = (addonType == "custombuttons");

    var copyNameItem = AM_context_Item("copy-name");
    copyNameItem.tooltipText = aAddon.name;
    copyNameItem.disabled = isUserStyle || isCustomButton;

    var copyVersionItem = AM_context_Item("copy-version");
    copyVersionItem.tooltipText = aAddon.version;
    copyVersionItem.disabled = isUserStyle || isCustomButton;

    var copyNameVersionItem = AM_context_Item("copy-nameversion");
    copyNameVersionItem.tooltipText = aAddon.name + " " + aAddon.version;
    copyNameVersionItem.disabled = isUserStyle || isCustomButton;

    var copyIdItem = AM_context_Item("copy-id");
    copyIdItem.tooltipText = aAddon.id;
    copyIdItem.disabled = isUserStyle || isCustomButton;

    var amoURL = aAddon.reviewURL
                 ? aAddon.reviewURL.replace(/\/reviews\//, "/")
                 : null;

    var copyURLItem = AM_context_Item("copy-url");
    var goHomeItem = AM_context_Item("go-home");
    if (aAddon.homepageURL) {
      copyURLItem.tooltipText = goHomeItem.tooltipText = aAddon.homepageURL;
    } else if (aAddon.reviewURL) {
      copyURLItem.tooltipText =  goHomeItem.tooltipText = amoURL;
    }
    copyURLItem.disabled = goHomeItem.disabled =
      !(aAddon.homepageURL || aAddon.reviewURL);

    var notesItem = AM_context_Item("release-notes");
    notesItem.disabled = !aAddon.releaseNotesURI;

    var amoItem = AM_context_Item("go-amo");
    amoItem.disabled = !amoURL || /addons.mozilla.org/.test(aAddon.homepageURL);
    amoItem.tooltipText = amoURL;

    var usoRegx = /^https?:\/\/userscripts.org\/scripts\/source\/\d+.\w+.js$/;
    var usoURL = "";
    if (aAddon._script) {
      var usDownloadURL = aAddon._script._downloadURL;
      var usUpdateURL = aAddon._script._updateURL;
      if (usoRegx.test(usDownloadURL)) {
        usoURL = usDownloadURL;
      } else if (usoRegx.test(usUpdateURL)) {
        usoURL = usUpdateURL;
      }
    }

    var usoItem = AM_context_Item("go-uso");
    usoItem.disabled = !usoRegx.test(usoURL);
    usoItem.className = isUserScript ? usoItem.disabled ? "" : "greasemonkey" : "";
    usoItem.tooltipText = usoURL.replace(/source/, "show") .replace(/.\w+.js$/, "");

    var fUsoItem = AM_context_Item("find-uso");
    fUsoItem.hidden = true;
    fUsoItem.disabled = usoRegx.test(usoURL);
    fUsoItem.className = isUserScript ? fUsoItem.disabled ? "" : "greasemonkey" : "";
    fUsoItem.setAttribute("find-on-uso", "http://userscripts.org/scripts/search?q=" +
                                         encodeURIComponent(aAddon.name));

    var supportItem = AM_context_Item("go-support");
    supportItem.disabled = !aAddon.supportURL;
    supportItem.tooltipText = aAddon.supportURL;

    var reviewItem = AM_context_Item("reviews");
    reviewItem.disabled = !aAddon.reviewURL;

    var donateItem = AM_context_Item("donate");
    donateItem.disabled = !aAddon.contributionURL;
    donateItem.tooltipText = gStrings.ext.formatStringFromName
                             ("contributionAmount2", [aAddon.contributionAmount], 1);

    AM_context_Item("browse-dir").disabled = isPlugin || isUserStyle || isUserScript ||
                                             (isTheme && aAddon.iconURL &&
                                              /^https?/.test(aAddon.iconURL)) || isCustomButton;

    var inspectItem = AM_context_Item("inspect-addon");
    inspectItem.disabled = !("inspectObject" in window);
    inspectItem.className = isUserScript ? isScriptish ? "" : "greasemonkey" : "";

    var inspectScript = AM_context_Item("inspect-userscript")
    inspectScript.disabled = !("inspectObject" in window);
    inspectScript.hidden = !isUserScript;

    var separator = AM_context_Item("menuseparator-2");
    separator.className = isUserScript ? "greasemonkey" : "";
    separator.hidden = isUserStyle || isCustomButton;
  },

  initPopup: function AM_context_initPopup(aEvent) {
    AM_Context.getAddon(AM_Context.getPopupNode.value, AM_Context.setItemsAttributes, aEvent);
  },

  onLoad: function AM_context_onLoad() {
    var popup = document.getElementById("addonitem-popup");
    popup.addEventListener("popupshowing", AM_Context.initPopup, false);
    popup.removeEventListener("popuphiding", AM_Context.initPopup, false);

  }
}

addEventListener("load", AM_Context.onLoad, false);
removeEventListener("unload", AM_Context.onLoad, false);

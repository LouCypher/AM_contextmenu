/*
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Contributor(s):
 *  - LouCypher (original code)
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

  log: function AM_context_log(aString) {
    Services.console.logStringMessage(aString);
  },

  makeURI: function AM_context_makeURI(aURL) {
    try {
      return Services.io.newURI(aURL, null, null);
    } catch(ex) {
      return null;
    }
  },

  getPopupNode: function AM_context_getPopupNode(aNode) {
    //Services.console.logStringMessage(aNode.nodeName);
    return "triggerNode" in aNode ? aNode.triggerNode : document.popupNode;
  },

  getAddon: function AM_context_getAddon(aId, aCallback, aEvent) {
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

  copyPersonasData: function AM_context_copyPersonasData(aAddon) {
    var id = aAddon.id.replace(/\@personas.mozilla.org/, "");
    var data = Services.prefs.getCharPref("lightweightThemes.usedThemes");
    var themes = JSON.parse(data);
    for (var i in themes) {
      if (themes[i].id == id) {
        data = JSON.stringify(themes[i]);
      }
    }
    try {
      Cu.import("resource:///modules/devtools/Jsbeautify.jsm");
      data = js_beautify(data);
    } catch(ex) {
    }
    AM_Context.copyToClipboard(data);
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
    //AM_Context.log(fileOrDir);
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
      url = "https://addons.mozilla.org/search/?q="
          + encodeURIComponent(aAddon.name);
    }
    openURL(url);
  },

  openReleaseNotes: function AM_context_releaseNotes(aAddon) {
    openURL(aAddon.releaseNotesURI.spec);
  },

  getAmoURL: function AM_context_getAmoURL(aAddon) {
    var sourceTracker = "/?src=external-Add-ons_Manager_Context_Menu-extension";

    if (/personas.mozilla.org$/.test(aAddon.id)) {
      var iconURI = AM_Context.makeURI(aAddon.iconURL);
      //AM_Context.log(iconURI.host);
      if (iconURI && (iconURI.host == "addons.mozilla.org" ||
                      iconURI.host == "getpersonas-cdn.mozilla.net")) {
        var id = aAddon.id.match(/\d+/).toString();
        if (iconURI.host == "getpersonas-cdn.mozilla.net") {
          return "http://getpersonas.com/persona/" + id;
        } else {
          return "https://addons.mozilla.org/addon/" + id;
        }
      }
    }

    var reviewURI = AM_Context.makeURI(aAddon.reviewURL);
    if (reviewURI && reviewURI.host == "addons.mozilla.org") {
      return aAddon.reviewURL.replace(/\/reviews\//, "/")
                             .replace(/\/(firefox|seamonkey|thunderbird|android)/, "")
                             .replace(/\/\?src\=api/, sourceTracker);
    }

    return null;
  },

  gotoAMO: function AM_context_gotoAMO(aAddon) {
    openURL(AM_Context.getAmoURL(aAddon));
  },

  getReviewURL: function AM_context_getReviewURL(aAddon) {
    var reviewURL = aAddon.reviewURL;
    if (reviewURL) {
      return reviewURL.replace(/\/(firefox|seamonkey|thunderbird|android)/, "");
    }
    if (/\d+\@personas.mozilla.org$/.test(aAddon.id)) {
      return AM_Context.getAmoURL(aAddon) + "/reviews/";
    }
    return null;
  },

  review: function AM_context_review(aAddon) {
    openURL(AM_Context.getReviewURL(aAddon));
  },

  support: function AM_context_support(aAddon) {
    openURL(aAddon.supportURL);
  },

  /*saveURL(aURL, aFileName, aFilePickerTitleKey, aShouldBypassCache,
            aSkipPrompt, aReferrer, aSourceDocument)*/
  /*saveSource: function AM_context_saveSource(aAddon) {
    saveURL(aAddon.sourceURI.spec, null, null, true, false, null, content.document);
  },*/

  setItemsAttributes: function AM_context_setItemsAttributes(aAddon, aEvent) {

    function AM_context_Item(aId) {
      return document.getElementById("AM-context-" + aId);
    }

    var addonType = aEvent.target.getAttribute("addontype");

    var isExtension = (addonType == "extension");
    var isTheme = (addonType == "theme");
    var isPersonas = isTheme && /personas.mozilla.org$/.test(aAddon.id);
    var isPlugin = (addonType == "plugin");
    var isUserStyle = (addonType == "userstyle");
    var isScriptish = (addonType == "userscript");
    var isUserScript = (addonType == "user-script") || // Greasemonkey
                       (addonType == "userscript") ||  // Scriptish
                       (addonType == "greasemonkey-user-script"); // Greasemonkey 1.7+
    var isCustomButton = (addonType == "custombuttons");

    var amoURL = AM_Context.getAmoURL(aAddon);
    //AM_Context.log(amoURL ? amoURL : "undefined");
    var reviewURL = AM_Context.getReviewURL(aAddon);
    //AM_Context.log(reviewURL ? reviewURL : "undefined");
    //var addonHasSource = aAddon.sourceURI && /^(http|ftp)s?/.test(aAddon.sourceURI.spec);

    var itemCopyPersonas = AM_context_Item("copy-personas-data");
    itemCopyPersonas.disabled = !isPersonas;
    //AM_Context.log(isPersonas);

    var itemCopyName = AM_context_Item("copy-name");
    itemCopyName.tooltipText = aAddon.name;
    itemCopyName.className = isUserScript ? isScriptish ? "" : "greasemonkey" : "";
    //itemCopyName.disabled = isUserStyle || isCustomButton;

    var itemCopyVersion = AM_context_Item("copy-version");
    itemCopyVersion.tooltipText = aAddon.version;
    itemCopyVersion.className = isUserScript ? isScriptish ? "" : "greasemonkey" : "";
    itemCopyVersion.disabled = isUserStyle || isCustomButton;

    var itemCopyNameVersion = AM_context_Item("copy-nameversion");
    itemCopyNameVersion.tooltipText = aAddon.name + " " + aAddon.version;
    itemCopyNameVersion.className = isUserScript ? isScriptish ? "" : "greasemonkey" : "";
    itemCopyNameVersion.disabled = isUserStyle || isCustomButton;

    var itemCopyId = AM_context_Item("copy-id");
    itemCopyId.tooltipText = aAddon.id;
    itemCopyId.className = isUserScript ? isScriptish ? "" : "greasemonkey" : "";
    //itemCopyId.disabled = isUserStyle || isCustomButton;

    var homepageURL = aAddon.homepageURL
                      ? /^https?:\/\/addons.mozilla.org/.test(aAddon.homepageURL)
                        ? amoURL.match(/[^\?]+/)
                        : aAddon.homepageURL
                      : null;

    var itemCopyURL = AM_context_Item("copy-url");
    var itemGoHome = AM_context_Item("go-home");
    if (homepageURL) {
      itemCopyURL.tooltipText = itemGoHome.tooltipText = homepageURL;
    }
    itemCopyURL.disabled = itemGoHome.disabled = !homepageURL;

    var itemReleaseNotes = AM_context_Item("release-notes");
    itemReleaseNotes.disabled = !aAddon.releaseNotesURI;

    var itemGotoAMO = AM_context_Item("go-amo");
    itemGotoAMO.disabled = !amoURL || amoURL.match(homepageURL);
    itemGotoAMO.tooltipText = amoURL ? amoURL.match(/[^\?]+/) : "";

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
    //if (isUserScript) AM_Context.log(usoURL);

    var itemGotoUSO = AM_context_Item("go-uso");
    itemGotoUSO.disabled = !usoRegx.test(usoURL);
    itemGotoUSO.className = isUserScript ? itemGotoUSO.disabled ? "" : "greasemonkey" : "";
    itemGotoUSO.tooltipText = usoURL.replace(/source/, "show").replace(/.\w+.js$/, "");

    var itemFindUSO = AM_context_Item("find-uso");
    itemFindUSO.hidden = true;
    itemFindUSO.disabled = usoRegx.test(usoURL);
    itemFindUSO.className = isUserScript ? itemFindUSO.disabled ? "" : "greasemonkey" : "";
    itemFindUSO.setAttribute("find-on-uso", "http://userscripts.org/scripts/search?q=" +
                                            encodeURIComponent(aAddon.name));

    var itemSupport = AM_context_Item("go-support");
    itemSupport.disabled = !aAddon.supportURL;
    itemSupport.tooltipText = aAddon.supportURL;

    var itemReview = AM_context_Item("reviews");
    itemReview.disabled = !reviewURL;

    var itemDonate = AM_context_Item("donate");
    itemDonate.disabled = !aAddon.contributionURL;
    itemDonate.tooltipText = gStrings.ext.formatStringFromName
                             ("contributionAmount2", [aAddon.contributionAmount], 1);

    AM_context_Item("browse-dir").disabled = isPlugin || isUserStyle || isUserScript ||
                                             (isTheme && aAddon.iconURL &&
                                              /^https?/.test(aAddon.iconURL)) ||
                                             isCustomButton;

    var itemInspect = AM_context_Item("inspect-addon");
    itemInspect.disabled = !("inspectObject" in window);
    itemInspect.className = isUserScript ? isScriptish ? "" : "greasemonkey" : "";

    var inspectScript = AM_context_Item("inspect-userscript")
    inspectScript.disabled = !("inspectObject" in window);
    inspectScript.hidden = !isUserScript;

    /*var itemDownload = AM_context_Item("download");
    itemDownload.disabled = !addonHasSource;
    itemDownload.tooltipText = aAddon.sourceURI.spec;*/

    var separator = AM_context_Item("menuseparator-2");
    separator.className = isUserScript ? "greasemonkey" : "";
    //separator.hidden = isUserStyle || isCustomButton;
  },

  initPopup: function AM_context_initPopup(aEvent) {
    AM_Context.getAddon(AM_Context.getPopupNode(aEvent.target).value,
                        AM_Context.setItemsAttributes, aEvent);
  },

  onLoad: function AM_context_onLoad() {
    var popup = document.getElementById("addonitem-popup");
    popup.addEventListener("popupshowing", AM_Context.initPopup, false);
    popup.removeEventListener("popuphiding", AM_Context.initPopup, false);

  }
}

addEventListener("load", AM_Context.onLoad, false);
removeEventListener("unload", AM_Context.onLoad, false);

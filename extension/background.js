/* global chrome */

// ------------------------------------------------------------
// Methods
// ------------------------------------------------------------

/**
 * Callback for when a new window has been created.
 */
const onWindowCreatedCallback = function () {
  // Get all windows
  chrome.windows.getAll(windows => {
    // If there are more windows that the current one, don't open tabs
    if (windows.length !== 1) {
      return
    }

    startOpeningUrls()
  })
}

/**
 * Callback for when the browser action button has been clicked.
 */
const onBrowserActionClickedCallback = function () {
  startOpeningUrls()
}

function startOpeningUrls () {
  // Get all tabs in the window
  chrome.tabs.query({}, tabs => {
    // Get the list of URLs from the storage
    chrome.storage.sync.get(['urls', 'removeBlank'], storage => {
      // Get urls or default to empty string
      let urls = storage.urls || ''

      urls = validateUrls(tabs, urls)

      openUrls(urls)

      // If requested, remove the about:blank tab
      if (storage.removeBlank) {
        // If only the newtab is open and no urls are set, don't close the newtab because that will close the browser
        if (tabs.length + urls.length === 1) {
          return
        }

        const tab = tabs.find(findTab('chrome://newtab/'))
        if (tab) {
          chrome.tabs.remove(tab.id)
          setFirstTabActive(tabs)
        }
      }
    })
  })
}

/**
 * Go to the first tab in list
 *
 * @param {chrome.tabs.Tab[]=} tabs
 */
function setFirstTabActive (tabs) {
  const run = tab => chrome.tabs.update(tab.id, { active: true, highlighted: true })
  if (typeof tabs !== 'undefined') {
    run(tabs[0])
    return
  }
  chrome.tabs.query({}, tabs => {
    run(tabs[0])
  })
}

/**
 * Callback for tabs.find function - return tab given by URL or undefined.
 *
 * @param {string} url
 * @return {function(string): chrome.tabs.Tab|undefined}
 */
function findTab (url) {
  return tab => (tab.url.startsWith(url) || (tab.pendingUrl && tab.pendingUrl.startsWith(url)))
}

/**
 * Return an array of URLs of sites to be opened.
 *
 * For each line in the urlsString, check if it's not empty and not a comment, and return it if it's not already opened.
 * @param {chrome.tabs.Tab[]} tabs
 * @param {string} urlsString
 */
function validateUrls (tabs, urlsString) {
  // Split lines into an array - one URL per line
  const urls = urlsString.split('\n')

  // Filter out irrelevant stuff
  return urls.filter((url) => {
    // Filter out empty lines and lines where first character other than space is #
    if (url.trim().length === 0 || url.trim().substr(0, 1) === '#') {
      return false
    }

    // Filter out where tab with given URL already exists
    return !tabs.find(findTab(url))
  })
}

/**
 * Open pinned tabs for all URLs in the array
 *
 * @param {string[]} urls
 * @param {Function=} callback
 */
function openUrls (urls, callback) {
  // Split the URLs string into separate URLs and check each URL
  urls.forEach((url) => {
    // Else open new pinned tab
    chrome.tabs.create({
      url,
      pinned: true
    }, callback || undefined)
  })
}

// ------------------------------------------------------------
// Listeners
// ------------------------------------------------------------

// Listener on when a new window is opened
chrome.windows.onCreated.addListener(onWindowCreatedCallback)
chrome.browserAction.onClicked.addListener(onBrowserActionClickedCallback)

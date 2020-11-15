/* global chrome */

// Since the extensions systems doesn't support translating the static HTML page, we need to do this manually
localizeHtmlPage()

// Setup references to elements
const saveBtn = document.getElementById('saveBtn')
const urls = document.getElementById('urls')
const removeBlankTab = document.getElementById('removeBlankTab')
const status = document.getElementById('status')
const year = document.getElementById('year')

// Set copyright year
year.innerHTML = (new Date().getFullYear()) + ''

// Get storage values and set them
chrome.storage.sync.get(['urls', 'removeBlank'], result => {
  urls.value = result.urls || ''
  removeBlankTab.checked = result.removeBlank || false
})

saveBtn.addEventListener('click', () => {
  try {
    chrome.storage.sync.set({
      urls: urls.value,
      removeBlank: removeBlankTab.checked
    }, () => setStatus('success', chrome.i18n.getMessage('notification_success_title'), chrome.i18n.getMessage('notification_success_msg')))
  } catch (e) {
    setStatus('error', chrome.i18n.getMessage('notification_error_title'), chrome.i18n.getMessage('notification_error_msg', [e]))
  }
})

function setStatus (type, title, msg) {
  status.setAttribute('class', type)
  status.innerHTML = '<b>' + title + '</b> ' + msg
}

function localizeHtmlPage () {
  // Localize by replacing __MSG_***__ meta tags
  const objects = document.getElementsByTagName('html')
  for (let j = 0; j < objects.length; j++) {
    const obj = objects[j]

    const valStrH = obj.innerHTML.toString()
    const valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
      return v1 ? chrome.i18n.getMessage(v1) : ''
    })

    if (valNewH !== valStrH) {
      obj.innerHTML = valNewH
    }
  }
}

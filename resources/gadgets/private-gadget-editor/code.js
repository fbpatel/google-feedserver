var service = null;
var privateGadgetNames = null;
var nameOfGadgetBeingEdited = '';
var entryOfGadgetBeingEdited = null;
var privateGadgetSpecFeedUrl = null;

var SERVICE_NAME = 'esp';
var APP_NAME = 'private-gadget-editor';

var SPINNER = '<img src="http://google-feedserver.googlecode.com/svn/trunk/resources/gadgets/private-gadget-editor/spinner.gif">';
var DEFAULT_SPINNER_ID = 'spinner';

var editor = {
  getCode: function() {
		return document.getElementById('editor').value;
  },
  setCode: function(text) {
		document.getElementById('editor').value = text;
  }
};

function $(id) {
  return document.getElementById(id);
};

function startSpinner(id) {
  $(id ? id : DEFAULT_SPINNER_ID).innerHTML = SPINNER;
};

function stopSpinner(id) {
  $(id ? id : DEFAULT_SPINNER_ID).innerHTML = '';
};

function initEditor() {
  if (privateGadgetSpecFeedUrl) {
    initGadgetNameList();
  }
};

function noCache(url) {
  return url + '?nocache=' + (new Date().getTime());
};

function setNameOfGadgetBeingEdited(name) {
  nameOfGadgetBeingEdited = name;
  if (name) {
    $('spec-url-wrapper').style.display = 'inline';
    var specUrl = 'http://feedserver-enterprise.googleusercontent.com/a/' +
        detectDomainName() + '/g/PrivateGadgetSpec/' + name;
    $('spec-url').href = specUrl;
  } else {
    $('spec-url-wrapper').style.display = 'none';
  }
};

function initGadgetNameList() {
  service = new google.gdata.client.FeedServerService(SERVICE_NAME, APP_NAME);
  service.setGadgetsAuthentication('SIGNED');
  service.getFeed(noCache(privateGadgetSpecFeedUrl), function(response) {
    stopSpinner();
    var entries = response && response.feed.entry ? response.feed.entry : [];
    showPrivateGadgetNames(setPrivateGadgetNames(entries));
  }, function(response) {
    stopSpinner()
    showMessage('Error: failed to load private gadget specs');
  });
  startSpinner();
};

function setPrivateGadgetNames(entries) {
  privateGadgetNames = [];
  for (var i = 0; i < entries.length; i++) {
    var name = entries[i].id.$t;
    name = name.substring(name.lastIndexOf('/') + 1);
    privateGadgetNames.push(name);
  }
  return privateGadgetNames;
};

function showPrivateGadgetNames() {
  var html = ['<select id="gadget-select" onchange="editSelectedGadget()">'];
  html.push('<option value="">Select to open</option>');
  for (var i = 0; i < privateGadgetNames.length; i++) {
    var privateGadgetName = privateGadgetNames[i];
    html.push('<option ', privateGadgetName == nameOfGadgetBeingEdited ? 'selected' : '',
        '>', privateGadgetName, '</option>');
  }
  document.getElementById('gadget-list').innerHTML = html.join('');
};

function getSelectedGadgetName() {
  return document.getElementById('gadget-select').value;
};

function editSelectedGadget() {
  var name = getSelectedGadgetName();
  if (name) {
    service.getEntry(noCache(privateGadgetSpecFeedUrl + '/' + name), function(response) {
      stopSpinner();
      setNameOfGadgetBeingEdited(name);
      entryOfGadgetBeingEdited = response.entry;
      editor.setCode(response.entry.content.entity.specContent);
    }, function(response) {
      stopSpinner();
      showMessage('Error: failed to open gadget spec "' + name + '"');
    });
    startSpinner();
  } else {
    newGadget();
  }
};

function deleteSelectedGadget() {
  var name = getSelectedGadgetName();
  if (name) {
    service.deleteEntry(privateGadgetSpecFeedUrl + '/' + name, function(response) {
      stopSpinner();
      initEditor();
      newGadget();
    }, function(response) {
      stopSpinner();
      showMessage('Error: failed to delete gadget spec "' + name + '"');
    });
    startSpinner();
  } else {
    alert('Please select a gadget to delete.');
  }
};

function newGadget() {
  setNameOfGadgetBeingEdited('');
  editor.setCode(getGadgetSpecTemplate());
  showPrivateGadgetNames();
  entryOfGadgetBeingEdited = {xmlns: 'http://www.w3.org/2005/Atom', content: {
      type: 'application/xml', entity: {name: '', specContent: ''}}};
};

function saveGadget(changeName) {
  entryOfGadgetBeingEdited.content.entity.specContent = editor.getCode();
  if (nameOfGadgetBeingEdited && !changeName) {
    service.updateEntry(privateGadgetSpecFeedUrl + '/' + nameOfGadgetBeingEdited,
        entryOfGadgetBeingEdited, function(response) {
      stopSpinner();
    }, function(error) {
      stopSpinner();
      showMessage('Error: failed to update gadget spec "' + nameOfGadgetBeingEdited + '"' + error);
    });
    startSpinner();
  } else {
    var name = changeName ?
      prompt('Please enter new name of gadget (e.g. hello.xml)') :
      prompt('Please enter name of new gadget (e.g. hello.xml)');
    if (!name) {
      return;
    }
    setNameOfGadgetBeingEdited(name);
    if (nameOfGadgetBeingEdited) {
      delete entryOfGadgetBeingEdited.content.entity.id;
      entryOfGadgetBeingEdited.content.entity.name = nameOfGadgetBeingEdited;
      service.insertEntry(privateGadgetSpecFeedUrl,
          entryOfGadgetBeingEdited, function(response) {
        stopSpinner();
        privateGadgetNames.push(nameOfGadgetBeingEdited);
        showPrivateGadgetNames();
      }, function(error) {
        stopSpinner();
        showMessage('Error: failed to add gadget spec "' + nameOfGadgetBeingEdited + '": ' + error);
      });
      startSpinner();
    }
  }
};

function openGadgetByUrl() {
  var gadgetSpecUrl = prompt('Please enter public URL of gadget spec');
  if (gadgetSpecUrl) {
    var params = {};
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.TEXT;
    gadgets.io.makeRequest(gadgetSpecUrl, function(response) {
      if (response.rc > 299) {
        showMessage('Error: ' + response.errors);
      } else {
        setNameOfGadgetBeingEdited(null);
        entryOfGadgetBeingEdited = {xmlns: 'http://www.w3.org/2005/Atom', content: {
          type: 'application/xml', entity: {name: '', specContent: response.text}}};
        editor.setCode(response.text);
      }
    }, params);
  }
};

function getGadgetSpecTemplate() {
  var textArea = document.getElementById('gadget-spec-template');
  return textArea.value || textArea.defaultValue;
};

function showMessage(message) {
  var miniMessage = new gadgets.MiniMessage(null, document.getElementById('message-box'));
  miniMessage.createDismissibleMessage(message);
};

function detectDomainName() {
  var params = location.href.split('&');
  for (var i = 0; i < params.length; i++) {
    if (params[i].indexOf('parent=') == 0) {
      var p = params[i].split('=');
      var parent = decodeURIComponent(p[1]);
      var r = /google.com(:[0-9]+)?\/a\/([^\/]*)\//.exec(parent);
      var domainName = r ? r[2] : null;
      return domainName;
    }
  }

  return null;
};

function initGadget() {
  var domainName = detectDomainName();
  if (domainName) {
    privateGadgetSpecFeedUrl = 'http://feedserver-enterprise.googleusercontent.com/a/' +
        domainName + '/g/PrivateGadgetSpec';
  } else {
    showMessage('Error: domain name missing');
  }

  gadgets.window.adjustHeight();
};

function init() {
  initGadget();
  initEditor();
};

gadgets.util.registerOnLoadHandler(init);

(function(){

/*jslint browser: true */
"use strict";

// Helper to enable TiddlyFox-style saving for a window
exports.enableSaving = function(doc) {
	// Create the message box
	var messageBox = doc.createElement("div");
	messageBox.id = "tiddlyfox-message-box";
	doc.body.appendChild(messageBox);
	// Inject saving code into TiddlyWiki classic
	if(isTiddlyWikiClassic(doc)) {
		injectClassicOverrides(doc);
	}
	// Listen for save events
	messageBox.addEventListener("tiddlyfox-save-file",function(event) {
		// Get the details from the message
		var message = event.target,
			filepath = message.getAttribute("data-tiddlyfox-path"),
			content = message.getAttribute("data-tiddlyfox-content");
		// Backup the existing file (if any)
		backupFile(filepath);
		// Save the file
		saveFile(filepath,content);
		// Remove the message element from the message box
		message.parentNode.removeChild(message);
		// Send a confirmation message
		var event = doc.createEvent("Events");
		event.initEvent("tiddlyfox-have-saved-file",true,false);
		event.savedFilePath = filepath;
		message.dispatchEvent(event);
		return false;
	},false);
}

// Helper to detect whether a document is a TiddlyWiki Classic
function isTiddlyWikiClassic(doc) {
	var versionArea = doc.getElementById("versionArea");
	return doc.getElementById("storeArea") &&
		(versionArea && /TiddlyWiki/.test(versionArea.text));
}

// Helper to inject overrides into TiddlyWiki Classic
function injectClassicOverrides(doc) {
	// Read classic-inject.js
	var xhReq = new XMLHttpRequest();
	xhReq.open("GET","../js/classic-inject.js",false);
	xhReq.send(null);
	// Inject it in a script tag
	var script = doc.createElement("script");
	script.appendChild(doc.createTextNode(xhReq.responseText));
	doc.getElementsByTagName("head")[0].appendChild(script);
}


// Helper function to save a file
function saveFile(filepath,content) {
	var fs = require("fs");
	fs.writeFileSync(filepath,content);
}

// Helper function to backup a file by copying it to the backup folder
function backupFile(filepath) {
	var fs = require("fs"),
		path = require("path");
	// Backup the file if it exists
	if(fs.existsSync(filepath)) {
		// Get the timestamp
		var timestamp = $tw.utils.stringifyDate(fs.statSync(filepath).mtime || (new Date())),
			backupSubPath = $tw.wiki.getTiddlerText("$:/TiddlyDesktop/BackupPath",""),
			filename = path.basename(filepath);
		// Replace $filename$ with the filename portion of the filepath and $filepath$ with the entire filepath 
		backupSubPath = backupSubPath
			.replace(/\$filename\$/mgi,filename)
			.replace(/\$filepath\$/mgi,filepath);
		// Compose and uniquify the backup pathname
		var count = 0,
			backupPath,
			uniquifier;
		do {
			uniquifier = count ? " " + count : "";
			backupPath = path.resolve(
				path.dirname(filepath),
				backupSubPath,
				filename + "." + timestamp + uniquifier + path.extname(filepath)
			);
			count = count + 1;
		} while(fs.existsSync(backupPath));
		// Copy the existing file to the backup
console.log("Backing up",filepath,backupPath);
		$tw.utils.createDirectory(path.dirname(backupPath));
		fs.writeFileSync(backupPath,fs.readFileSync(filepath)); // For some reason $tw.utils.copyFile() doesn't work here
	}
}

})();

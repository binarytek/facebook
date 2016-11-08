/**
 * USE:
 * Automatically checks every second whether a new unread fb notification for the given group exist.
 * If yes, then opens the group page url and
 * displays a desktop notification for the new group post and play a looped sound until the notification is closed.
 * Optionally you can receive the notifications per email.
 *
 * INSTALL:
 * 1) Install browser extension that supports adding Javascript to a website, like Styler:
 *    - Firefox: https://addons.mozilla.org/en-US/firefox/addon/stylish/
 *    - Chrome: https://chrome.google.com/webstore/detail/styler/bogdgcfoocbajfkjjolkmcdcnnellpkb?hl=en
 * 2) Add this javascript to your facebook group.
 */

/*
 * CONFIGURE: change the following options as desired
 */
var options = {
    fbGroupName: "Michael Freeman's Manual Signals Group", // the same as displayed in the fb notification top right
    fbGroupUrl: "https://www.facebook.com/groups/944105548940739/", // official fb group url
    fbNames: ["John Mukunju", "Afzal Ahmed", "Rene GZ", "SN IR"], // the fb names for which you will get notifications
    unreadMessageInterval: 200, // in milliseconds, how often to check for unread fb notifications
    soundLoopInterval: 5000, // in milliseconds, how often to repeat the sound until notification is closed.

    // if you want to receive email for every new notification, you will have to:
    // 1) set "sendEmail" to true
    // 2) create an account at http://www.emailjs.com/
    // 3) create an email template and save its name in "emailTemplate"
    email: {
        sendEmail: false,
        emailJsUrl: "https://cdn.emailjs.com/dist/email.min.js",
        emailService: "gmail",
        emailTemplate: "template_ptdUWfM4"
    }
};

if (window.location.href === options.fbGroupUrl) {

    class FBGroupNotifier {

        constructor(options) {
            this.fbGroupName = options.fbGroupName;
            this.fbGroupUrl = options.fbGroupUrl;
            this.fbNames = options.fbNames;
            this.unreadMessageInterval = options.unreadMessageInterval;
            this.soundLoopInterval = options.soundLoopInterval;
            this.email = options.email;
            if (this.email.sendEmail) {
                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = '"https://cdn.emailjs.com/dist/email.min.js"';
                head.appendChild(script);
            }

            this.sound = new Audio("https://github.com/binarytek/sounds/raw/master/message.mp3");

            this.storageStr = "messagesSent";
        }

        start() {
            console.log('Notifications started for the FB Group: ' + this.fbGroupName);
            this.requestNotificationPermission();
            this.checkForUnreadFBGroupNotification();
            this.checkForNewFBGroupPosts();
        }

        requestNotificationPermission() {
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notification");
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                });
            }
        }

        checkForUnreadFBGroupNotification() {
            var self = this;
            setInterval(function() {

                var notificationsCount = parseInt(document.getElementById("notificationsCountValue").textContent);
                if (notificationsCount > 0) {
                    var notificationsButton = document.querySelector(".jewelButton[name='notifications']");
                    notificationsButton.click();
                    setTimeout(function() {
                        document.querySelectorAll('._33c').forEach(function(notificationItemEl) {
                            var gt = notificationItemEl.dataset.gt;
                            // gt = '{"notif_type":"group_activity","subtype":"from_non_friend","context_id":"944105548940739","alert_id":"1476249007560401","unread":0,"from_uids":{"100000672484701":"100000672484701"},"microtime_sent":"1476415653452274","content_id":"1397185103632779","row":0}';
                            var unreadStr = '"unread":1';
                            if (gt.indexOf(unreadStr) !== -1) {
                                var mainSpanEl = notificationItemEl.querySelector("._4l_v span");
                                var spanChildren = mainSpanEl.childNodes;
                                for(var i = 0; i < spanChildren.length; i++) {
                                    var spanChildEl = spanChildren[i];
                                    var spanChildText = spanChildEl.textContent;
                                    if (spanChildText === self.fbGroupName) {
                                        window.location.href = self.fbGroupUrl;
                                    }
                                }
                            }
                        });
                    }, 200);
                }

            }, self.unreadMessageInterval);
        }

        getMessagesSent() {
            var localMessagesSent = sessionStorage.getItem(this.storageStr);
            var messagesSent;
            if (localMessagesSent &&
                localMessagesSent !== "null" &&
                localMessagesSent !== "[object Object]") {
                messagesSent = JSON.parse(localMessagesSent);
            } else {
                messagesSent = {};
            }
            return messagesSent;
        }

        processMessage(messagesSent, fbMessage, fbName) {
            var self = this;
            // console.log("messagesSent inside = " + JSON.stringify(messagesSent));
            // console.log('fbMessage = ' + fbMessage);
            if (!messagesSent[fbMessage]) {
                messagesSent[fbMessage] = true;
                sessionStorage.setItem(self.storageStr, JSON.stringify(messagesSent));
                var newNotification = "[" + fbName + "]: " + fbMessage;
                var notification = new Notification(newNotification);

                self.sound.play();
                var soundInterval = setInterval(function() {
                    self.sound.play();
                }, self.soundLoopInterval);
                notification.onclose = function() {
                    clearInterval(soundInterval);
                };

                if (self.email.sendEmail) {
                    emailjs.send(self.email.emailService, self.email.emailTemplate,{
                        message: newNotification
                    })
                    .then(function(response) {},
                          function(error) {console.log("Email sent error: ", JSON.stringify(error));}
                    );
                }
            }
        }

        checkForNewFBGroupPosts() {
            var self = this;
            setInterval(function(){
                var messagesSent = self.getMessagesSent();
                document.querySelectorAll('#pagelet_group_mall ._5x46').forEach(function(el) {
                    var fbNameTime = el.textContent;
                    var fbMessage = el.nextSibling.textContent;
                    self.fbNames.forEach(function(fbName) {
                        var fbNameIndex = fbNameTime.indexOf(fbName);
                        if (fbNameIndex !== -1) {
                            var timeStr = fbNameTime.substring(fbName.length, fbNameTime.length);
                            // console.log('timeStr = ' + timeStr);
                            if (timeStr.indexOf("min") !== -1 || timeStr.indexOf("Just") !== -1) {
                                self.processMessage(messagesSent, fbMessage, fbName)
                            }
                        }
                    });
                });

            }, 500);
        }
    }

    var notifier = new FBGroupNotifier(options);

    setTimeout(function() {
        notifier.start();
    }, 3000);
}

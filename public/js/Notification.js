class Notification {
  static notificationContainer = null;
  static currentNotification = null; // Track the currently displayed notification
  static oldNotification = null; // Track the previous notification for fade-out

  static initializeContainer() {
    if (!Notification.notificationContainer) {
      Notification.notificationContainer = document.createElement("div");
      Notification.notificationContainer.className = "notification-container";
      document.body.appendChild(Notification.notificationContainer);
    }
    Notification.updateNotificationPosition();
  }

  static updateNotificationPosition() {
    const tutorialPane = document.querySelector('.tutorial-overlay');
    if (tutorialPane) {
      const tutorialPaneRect = tutorialPane.getBoundingClientRect();
      const notificationContainer = Notification.notificationContainer;

      // Position the container just above the tutorial pane
      notificationContainer.style.bottom = `${window.innerHeight - tutorialPaneRect.top + 10}px`;
    }
  }

  static createNotification(message, type, duration) {
    Notification.initializeContainer();

    // Remove the old notification if it exists (history slot)
    if (Notification.oldNotification) {
      Notification.oldNotification.remove(); // Instantly remove the old notification
      Notification.oldNotification = null; // Clear reference to the old one
    }

    // Move the current notification to the old slot if it exists
    if (Notification.currentNotification) {
      Notification.oldNotification = Notification.currentNotification;
      Notification.oldNotification.classList.remove("show");
      Notification.oldNotification.classList.add("move-up", "fade-out");

      // Ensure the old notification is above the new one
      Notification.oldNotification.style.zIndex = "1";

      // Remove the old notification after it fades out
      setTimeout(() => {
        if (Notification.oldNotification) {
          Notification.oldNotification.remove();
          Notification.oldNotification = null;
        }
      }, 500); // Match fade-out duration in CSS
    }

    // Create the new notification
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Ensure the new notification is visually in front
    notification.style.zIndex = "2";

    // Append and instantly show the new notification
    Notification.notificationContainer.appendChild(notification);
    Notification.currentNotification = notification;

    // Automatically remove the new notification after the specified duration
    setTimeout(() => {
      Notification.removeNotification(notification);
    }, duration);

    Notification.updateNotificationPosition();
  }

  static removeNotification(notification) {
    notification.classList.add("fade-out");

    setTimeout(() => {
      notification.remove();
      if (Notification.currentNotification === notification) {
        Notification.currentNotification = null;
      }
    }, 500); // Match fade-out duration in CSS
  }

  static success(message, duration = 4000) {
    Notification.createNotification(message, "success", duration);
  }

  static failure(message, duration = 3000) {
    Notification.createNotification(message, "failure", duration);
  }

  static message(message, duration = 2000) {
    Notification.createNotification(message, "message", duration);
  }
}

export default Notification;

